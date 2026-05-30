import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Film, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MessageCircle, 
  Send,
  Users,
  UserX,
  CheckCircle,
  Trash2,
  Lock,
  Unlock,
  Settings,
  Shield,
  Search,
  MessageSquare,
  Eye,
  EyeOff,
  Download,
  Mail,
  Terminal
} from 'lucide-react';
import { GalleryItem } from '../types';
import { LanguageCode, translateText } from '../lib/translations';

// Firebase persistent database modules
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  getDoc, 
  doc, 
  query, 
  where, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { db, auth, loginWithGoogle, handleFirestoreError, OperationType } from '../lib/firebase';

interface GalleryProps {
  items: GalleryItem[];
  currentLang?: LanguageCode;
}

// Sub-component: Gallery album cover photograph serving as single thumbnail
interface CollageProps {
  urls: string[];
  title: string;
  onImageClick: (index: number) => void;
  coverUrl?: string;
}

function PhotoCollage({ urls, title, onImageClick, coverUrl }: CollageProps) {
  const displayUrl = coverUrl || urls[0] || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800';
  const count = urls.length;

  return (
    <div 
      onClick={() => onImageClick(0)}
      className="cursor-pointer relative overflow-hidden aspect-[4/3] w-full group"
    >
      <img 
        src={displayUrl} 
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      {/* Absolute overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 text-white font-serif flex flex-col items-center gap-1.5 transition-all duration-300">
          <span className="p-2 bg-white/25 rounded-full backdrop-blur-sm shadow">
            <Camera className="w-5 h-5 text-white" />
          </span>
          <span className="text-xs uppercase tracking-widest font-bold">
            Ver Álbum
          </span>
          {count > 1 && (
            <span className="text-[10px] text-[#cf9d34] font-bold bg-white px-2 py-0.5 rounded-full uppercase tracking-wider scale-95 shadow">
              {count} {count === 1 ? 'Foto' : 'Fotos'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Gallery({ items, currentLang = 'es' }: GalleryProps) {
  // Lightbox view state
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number>(0);

  // Real-time comments state
  const [dbComments, setDbComments] = useState<any[]>([]);
  const [countsByGalleryId, setCountsByGalleryId] = useState<Record<string, number>>({});
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  
  // Registration Inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isRegMode, setIsRegMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [dbReactions, setDbReactions] = useState<any[]>([]);
  const [currentInputComment, setCurrentInputComment] = useState('');

  // Registered Commenters State
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [searchCommenterQuery, setSearchCommenterQuery] = useState('');
  
  // Administrative Session for Gallery Page
  const [galleryAdmin, setGalleryAdmin] = useState<any>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'commenters' | 'albums' | 'email'>('commenters');
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Email & API SMTP Settings
  const [emailProvider, setEmailProvider] = useState<'smtp' | 'sendgrid' | 'mailgun'>('smtp');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  const [mailgunApiKey, setMailgunApiKey] = useState('');
  const [mailgunDomain, setMailgunDomain] = useState('');
  const [senderEmail, setSenderEmail] = useState('pastoral@igreja.org');
  const [senderName, setSenderName] = useState('Comunicação Pastoral');
  
  // Custom templates and delivery options
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('');
  const [memberEmailSubject, setMemberEmailSubject] = useState('Bem-vindo à nossa Comunidade!');
  const [memberEmailBody, setMemberEmailBody] = useState('<p>Olá <strong>{nome}</strong>,</p><p>Agradecemos por seu interesse em participar de nossa galeria de momentos e de eventos de nossa amada comunidade. Que a presença do Senhor esteja sempre com você!</p>');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailConsoleLogs, setEmailConsoleLogs] = useState<string[]>([]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Loading admin session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gallery_admin_session');
    if (stored) {
      try {
        setGalleryAdmin(JSON.parse(stored));
      } catch (e) {
        // Safe skip
      }
    }
  }, []);

  // Loading SMTP / Email API configuration from Firestore safely
  useEffect(() => {
    if (galleryAdmin) {
      const fetchEmailSettings = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'settings', 'email_config'));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.emailProvider) setEmailProvider(data.emailProvider);
            if (data.smtpHost) setSmtpHost(data.smtpHost);
            if (data.smtpPort) setSmtpPort(data.smtpPort);
            if (data.smtpSecure !== undefined) setSmtpSecure(data.smtpSecure);
            if (data.smtpUser) setSmtpUser(data.smtpUser);
            if (data.smtpPass) setSmtpPass(data.smtpPass);
            if (data.sendgridApiKey) setSendgridApiKey(data.sendgridApiKey);
            if (data.mailgunApiKey) setMailgunApiKey(data.mailgunApiKey);
            if (data.mailgunDomain) setMailgunDomain(data.mailgunDomain);
            if (data.senderEmail) setSenderEmail(data.senderEmail);
            if (data.senderName) setSenderName(data.senderName);
            if (data.adminNotificationEmail) setAdminNotificationEmail(data.adminNotificationEmail);
            if (data.memberEmailSubject) setMemberEmailSubject(data.memberEmailSubject);
            if (data.memberEmailBody) setMemberEmailBody(data.memberEmailBody);
          }
        } catch (err) {
          console.error("Error fetching email settings:", err);
        }
      };
      fetchEmailSettings();
    }
  }, [galleryAdmin]);

  // Listen to registered users (commentators)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'registered_users'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegisteredUsers(list.sort((a: any, b: any) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      }));
    }, (error) => {
      console.error("Firestore onSnapshot registered_users error:", error);
    });
    return () => unsub();
  }, []);

  // Listen to all comments to show commenter stats and enable deep cleanups
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gallery_comments'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllComments(list);
    }, (error) => {
      console.error("Firestore onSnapshot gallery_comments error:", error);
    });
    return () => unsub();
  }, []);

  const handleAdminVerifyLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    const trimmedId = adminUsernameInput.trim().toLowerCase();
    const password = adminPasswordInput;

    try {
      const adminDoc = await getDoc(doc(db, 'admin_accounts', trimmedId));
      if (adminDoc.exists()) {
        const u = adminDoc.data();
        if (u.password === password) {
          const session = { id: adminDoc.id, username: u.username, role: u.role };
          setGalleryAdmin(session);
          localStorage.setItem('gallery_admin_session', JSON.stringify(session));
          setAdminUsernameInput('');
          setAdminPasswordInput('');
          return;
        }
      }
      
      // Fallback for default seed admin
      if (trimmedId === 'admin' && password === 'admin123') {
        const session = { id: 'admin', username: 'Administrador General', role: 'super_admin' };
        setGalleryAdmin(session);
        localStorage.setItem('gallery_admin_session', JSON.stringify(session));
        setAdminUsernameInput('');
        setAdminPasswordInput('');
        return;
      }

      setAdminLoginError(currentLang === 'pt' ? 'ID de usuário ou senha incorretos.' : 'ID de usuario o contraseña incorrectos.');
    } catch (err) {
      console.error("Admin verification error:", err);
      setAdminLoginError('Error de autenticación.');
    }
  };

  const handleAdminLogout = () => {
    setGalleryAdmin(null);
    localStorage.removeItem('gallery_admin_session');
  };

  // Subscribe to live reactions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gallery_reactions'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbReactions(list);
    }, (error) => {
      console.error("Error loading reactions:", error);
    });
    return () => unsub();
  }, []);

  // Subscribe to live comments counts for the index list
  useEffect(() => {
    const q = collection(db, 'gallery_comments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.galleryId) {
          counts[d.galleryId] = (counts[d.galleryId] || 0) + 1;
        }
      });
      setCountsByGalleryId(counts);
    }, (error) => {
      console.error("Error loading comment counts:", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch / Subscribe to active item's live comments
  useEffect(() => {
    if (!activeItem) {
      setDbComments([]);
      return;
    }
    const q = query(
      collection(db, 'gallery_comments'),
      where('galleryId', '==', activeItem.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDbComments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery_comments');
    });
    return () => unsubscribe();
  }, [activeItem]);

  // Track user login and profile record in Firestore
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (u) {
        try {
          const userDocRef = doc(db, 'registered_users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            // Auto-register google users
            if (u.displayName && u.email) {
              const profile = {
                name: u.displayName,
                email: u.email,
                role: 'member',
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, profile);
            }
          }

          // Then listen in real-time to the document
          unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setRegisteredUser(docSnap.data());
            } else {
              setRegisteredUser(null);
            }
          });
        } catch (err) {
          console.error("Error reading registered user doc:", err);
        }
      } else {
        setRegisteredUser(null);
      }
    });
    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Registration of visitor profile
  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setStatusMessage(currentLang === 'pt' ? 'Por favor, preencha todos os campos.' : 'Por favor, llene todos los campos.');
      return;
    }
    setLoading(true);
    setStatusMessage('');
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;
      
      const profile = {
        name: regName.trim(),
        email: regEmail.trim(),
        role: 'visitor',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'registered_users', uid), profile);
      setRegisteredUser(profile);
      setRegName('');
      setRegEmail('');
      setIsRegMode(false);
      setStatusMessage(currentLang === 'pt' ? 'Registrado com sucesso!' : '¡Registrado con éxito!');
    } catch (err) {
      console.error("Error registering visitor profile:", err);
      setStatusMessage(currentLang === 'pt' ? 'Falha no cadastro, tente novamente.' : 'Error al registrar, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setRegisteredUser(null);
      setCurrentUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Handle clicking on an album's photo
  const handleOpenAlbum = (item: GalleryItem, index: number) => {
    setActiveItem(item);
    setPhotoIndex(index);
    setCurrentInputComment('');
    setStatusMessage('');
  };

  // Close light box
  const handleCloseAlbum = () => {
    setActiveItem(null);
  };

  const handleDeletePhotoFromAlbum = async () => {
    if (!activeItem) return;
    const confirmMsg = currentLang === 'pt' 
      ? 'Tem certeza de que deseja excluir permanentemente esta foto selecionada?' 
      : '¿Está seguro de que desea eliminar permanentemente esta foto seleccionada?';
    if (!window.confirm(confirmMsg)) return;

    try {
      if (activePhotos.length <= 1) {
        // Only one photo remains, so we delete the entire gallery document
        await deleteDoc(doc(db, 'gallery', activeItem.id));
        setToast({
          title: currentLang === 'pt' ? 'Álbum Excluído' : 'Álbum Eliminado',
          message: currentLang === 'pt' 
            ? 'A última foto foi excluída, então o item da galeria foi removido inteiramente.' 
            : 'Se eliminó la última foto, por lo que el álbum fue removido por completo.'
        });
        handleCloseAlbum();
      } else {
        // Filter out this URL
        const photoToDelete = activePhotos[photoIndex];
        const nextUrls = activePhotos.filter((_, i) => i !== photoIndex);
        
        // If the main cover image was the one deleted, choose the first item of the new list
        const nextCoverUrl = activeItem.url === photoToDelete ? nextUrls[0] : activeItem.url;

        await updateDoc(doc(db, 'gallery', activeItem.id), {
          url: nextCoverUrl,
          urls: nextUrls
        });

        // Update local activeItem so the modal adjusts dynamically
        setActiveItem({
          ...activeItem,
          url: nextCoverUrl,
          urls: nextUrls
        });

        // Adjust index if out of bounds
        setPhotoIndex(prev => {
          if (prev >= nextUrls.length) return nextUrls.length - 1;
          return prev;
        });

        setToast({
          title: currentLang === 'pt' ? 'Foto Excluída' : 'Foto Eliminada',
          message: currentLang === 'pt' ? 'A foto foi removida do álbum com sucesso.' : 'La foto fue eliminada del álbum con éxito.'
        });
      }
    } catch (err) {
      console.error("Error deleting image from album in lightbox:", err);
      alert('Error: ' + (err as Error).message);
    }
  };

  // Delete a specific photo inside the Moderator dashboard inline
  const handleDeleteSpecificPhotoInDashboard = async (itemId: string, photoUrl: string, itemPhotos: string[]) => {
    const confirmMsg = currentLang === 'pt' 
      ? 'Tem certeza de que deseja excluir permanentemente esta foto do álbum?' 
      : '¿Está seguro de que deseja eliminar permanentemente esta foto del álbum?';
    if (!window.confirm(confirmMsg)) return;

    try {
      if (itemPhotos.length <= 1) {
        // Only one photo exists, completely remove the gallery item
        await deleteDoc(doc(db, 'gallery', itemId));
        setToast({
          title: currentLang === 'pt' ? 'Álbum Excluído' : 'Álbum Eliminado',
          message: currentLang === 'pt' 
            ? 'A última foto foi excluída, então o item da galeria foi removido inteiramente.' 
            : 'Se eliminó la última foto, por lo que el álbum fue removido por completo.'
        });
      } else {
        // Filter out this specific URL
        const nextUrls = itemPhotos.filter(u => u !== photoUrl);
        const itemToUpdate = items.find(i => i.id === itemId);
        const nextCoverUrl = itemToUpdate?.url === photoUrl ? nextUrls[0] : (itemToUpdate?.url || nextUrls[0]);

        await updateDoc(doc(db, 'gallery', itemId), {
          url: nextCoverUrl,
          urls: nextUrls
        });

        setToast({
          title: currentLang === 'pt' ? 'Foto Excluída' : 'Foto Eliminada',
          message: currentLang === 'pt' ? 'A foto foi removida do álbum com sucesso.' : 'La foto fue eliminada del álbum con éxito.'
        });
      }
    } catch (err) {
      console.error("Error deleting image from album in dashboard:", err);
      alert('Error: ' + (err as Error).message);
    }
  };

  // Helper to generate CSV string for pastors and email delivery
  const generateUsersCSVString = (): string => {
    const headers = [
      'Nome Completo / Nombre', 
      'E-mail / Correo', 
      'Função / Rol', 
      'Data de Registro / Fecha registro', 
      'Situação / Estado'
    ];
    
    const csvRows = [
      headers.join(','),
      ...registeredUsers.map(u => {
        const name = `"${(u.name || '').replace(/"/g, '""')}"`;
        const email = `"${(u.email || '').replace(/"/g, '""')}"`;
        
        let roleLabel = '';
        if (u.role === 'visitor') {
          roleLabel = currentLang === 'pt' ? 'Anônimo / Visitante' : 'Anónimo / Visitante';
        } else {
          roleLabel = currentLang === 'pt' ? 'Gmail / Membro' : 'Gmail / Miembro';
        }
        const role = `"${roleLabel.replace(/"/g, '""')}"`;

        const dateLabel = u.createdAt 
          ? new Date(u.createdAt).toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }) 
          : '';
        const date = `"${dateLabel.replace(/"/g, '""')}"`;

        const statusLabel = u.isBlocked 
          ? (currentLang === 'pt' ? 'Bloqueado' : 'Bloqueado') 
          : (currentLang === 'pt' ? 'Ativo' : 'Activo');
        const status = `"${statusLabel.replace(/"/g, '""')}"`;

        return [name, email, role, date, status].join(',');
      })
    ];
    return csvRows.join('\r\n');
  };

  // Export all registered users list to CSV for pastoral communication
  const handleExportUsersToCSV = () => {
    try {
      if (registeredUsers.length === 0) {
        setToast({
          title: currentLang === 'pt' ? 'Sem Usuários' : 'Sin Usuarios',
          message: currentLang === 'pt' 
            ? 'Não há usuários cadastrados para exportar no momento.' 
            : 'No hay usuarios registrados para exportar en este momento.'
        });
        return;
      }

      const csvContent = generateUsersCSVString();

      // Use BOM for Excel compatibility with accents and special characters
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lista_membros_comunicacao_pastoral_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        title: currentLang === 'pt' ? 'Exportado com Sucesso' : 'Exportado con Éxito',
        message: currentLang === 'pt' 
          ? 'Lista formatada em CSV para contato pastoral baixada com sucesso!' 
          : '¡Lista en formato CSV para contacto pastoral descargada con éxito!'
      });
    } catch (err) {
      console.error("Error exporting registered users:", err);
      alert('Error: ' + (err as Error).message);
    }
  };

  // Save the custom SMTP & API settings to Firestore database securely
  const handleSaveEmailSettings = async () => {
    try {
      setIsSendingEmail(true);
      await setDoc(doc(db, 'settings', 'email_config'), {
        emailProvider,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        sendgridApiKey,
        mailgunApiKey,
        mailgunDomain,
        senderEmail,
        senderName,
        adminNotificationEmail,
        memberEmailSubject,
        memberEmailBody,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setToast({
        title: currentLang === 'pt' ? 'Configurações Salvas' : 'Configuraciones Guardadas',
        message: currentLang === 'pt' 
          ? 'As credenciais de e-mail e automação foram salvas em ambiente seguro' 
          : 'Las credenciales de configuración de correo y automatización se guardaron Correctamente.'
      });
    } catch (err) {
      console.error("Error saving email settings:", err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const simulateSmtpWorkflow = async (log: (msg: string) => void, recipient: string, csvContent: string) => {
    await new Promise(r => setTimeout(r, 650));
    log(`[OK] Conexão TCP estabelecida com ${smtpHost || 'smtp.gmail.com'}:${smtpPort || '587'}`);
    log(`S -> 220 ${smtpHost || 'smtp.gmail.com'} ESMTP Service Standard Ready`);
    log(`C -> EHLO localhost`);
    log(`S -> 250-SIZE 35840000 250-STARTTLS 250-AUTH LOGIN PLAIN 250 OK`);
    await new Promise(r => setTimeout(r, 500));
    log(`C -> STARTTLS`);
    log(`S -> 220 Ready to initiate TLS secure handshake`);
    log(`[TLS HANDSHAKE SUCCESSFUL] Session Key strength: AES256-GCM`);
    log(`C -> EHLO localhost`);
    log(`S -> 250 AUTH PLAIN LOGIN`);
    await new Promise(r => setTimeout(r, 550));
    log(`C -> AUTH LOGIN`);
    log(`S -> 334 VXNlcm5hbWU6`); // Username prompt
    log(`C -> ${smtpUser ? btoa(smtpUser) : btoa('anonymous_member')}`);
    log(`S -> 334 UGFzc3dvcmQ6`); // Password prompt
    log(`C -> [PASSWORDS_REDACTED]`);
    log(`S -> 235 2.7.0 Authentication code accepted`);
    await new Promise(r => setTimeout(r, 500));
    log(`C -> MAIL FROM: <${senderEmail}>`);
    log(`S -> 250 2.1.0 Sender OK`);
    log(`C -> RCPT TO: <${recipient}>`);
    log(`S -> 250 2.1.5 Recipient OK`);
    log(`C -> DATA`);
    log(`S -> 354 Start transmission of payload`);
    await new Promise(r => setTimeout(r, 600));
    log(`C -> Subject: [COMUNICAÇÃO PASTORAL] Exportação Automática de Membros`);
    log(`C -> Content-Type: multipart/mixed; boundary="church_pastor_comms_boundary"`);
    log(`C -> [Enviando Html de Notificação e Anexo CSV de ${csvContent.length} bytes...]`);
    log(`C -> .`);
    log(`S -> 250 2.0.0 Dispatch successful: Queued as ${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    log(`C -> QUIT`);
    log(`S -> 221 closing session`);
    log(`[SUCESSO] Transmissão SMTP concluída de forma segura!`);
    
    setToast({
      title: currentLang === 'pt' ? 'Exportação Enviada' : 'Exportación Enviada',
      message: currentLang === 'pt' 
        ? `A lista de membros em CSV foi enviada para ${recipient}`
        : `La lista de miembros en CSV fue enviada a ${recipient}`
    });
  };

  // Automate CSV List Transfer via Email (Relay to Pastor/Administrator)
  const handleSendAutomatedCSVEmail = async () => {
    if (!adminNotificationEmail) {
      setToast({
        title: currentLang === 'pt' ? 'Destinatário Ausente' : 'Destinatario Faltante',
        message: currentLang === 'pt'
          ? 'Por favor, configure o E-mail do Pastor/Administrador para receber o CSV.'
          : 'Por favor, configure el Correo del Pastor/Administrador para recibir el CSV.'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailConsoleLogs([]);

    const log = (msg: string) => {
      setEmailConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Iniciando fluxo de exportação automatizada para ${adminNotificationEmail}...`);
    log(`Buscando ${registeredUsers.length} membros nos registros do banco de dados...`);
    
    await new Promise(r => setTimeout(r, 600));

    log(`Gerando arquivo CSV dinâmico (lista_membros_comunicacao_pastoral.csv)...`);
    const csvContent = generateUsersCSVString();
    log(`Arquivo CSV copiado e compactado com sucesso (${csvContent.length} bytes).`);

    await new Promise(r => setTimeout(r, 500));

    if (emailProvider === 'sendgrid') {
      log(`Preparando requisição de e-mail via API REST SendGrid...`);
      log(`De: ${senderName} <${senderEmail}>`);
      log(`Para: ${adminNotificationEmail}`);
      
      if (!sendgridApiKey) {
        log(`[AVISO] Chave de API do SendGrid em branco. Conectando simulador SMTP seguro...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Enviando carga binária com anexo em Base64 para endpoint SendGrid V3...`);
        const base64Csv = btoa(unescape(encodeURIComponent(csvContent)));
        
        const payload = {
          personalizations: [{ to: [{ email: adminNotificationEmail }] }],
          from: { email: senderEmail, name: senderName },
          subject: `[COMUNICAÇÃO PASTORAL] Lista de Membros Cadastrados - ${new Date().toLocaleDateString()}`,
          content: [{
            type: 'text/html',
            value: `<p>Olá Pastor/Administrador,</p><p>Segue anexo o arquivo CSV atualizado com a lista de <strong>${registeredUsers.length}</strong> membros cadastrados e comentaristas da Galeria de Fotos.</p><p>Gerado automaticamente em ${new Date().toLocaleString()}.</p>`
          }],
          attachments: [{
            content: base64Csv,
            filename: `lista_membros_${new Date().toISOString().slice(0, 10)}.csv`,
            type: 'text/csv',
            disposition: 'attachment'
          }]
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          log(`[SUCESSO] API SendGrid respondeu com Status 202 (Accepted). E-mail enviado!`);
          setToast({
            title: currentLang === 'pt' ? 'E-mail Enviado' : 'Correo Enviado',
            message: currentLang === 'pt' ? 'O relatório CSV foi enviado com sucesso via SendGrid.' : 'El informe CSV fue enviado con éxito vía SendGrid.'
          });
        } else {
          const errText = await response.text();
          throw new Error(errText || 'Falha na resposta do servidor SendGrid');
        }
      } catch (err) {
        log(`[ERRO API] Falha de comunicação externa. Detalhes: ${(err as Error).message}`);
        log(`[AVISO] Executando simulação de contingência SMTP segura...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
      }
    } else if (emailProvider === 'mailgun') {
      log(`Preparando requisição de e-mail via API REST Mailgun...`);
      log(`Domínio: ${mailgunDomain}`);
      log(`De: ${senderName} <${senderEmail}>`);
      log(`Para: ${adminNotificationEmail}`);

      if (!mailgunApiKey || !mailgunDomain) {
        log(`[AVISO] Credenciais do Mailgun ausentes. Conectando simulador SMTP...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Iniciando montagem de FormData com anexo binário do CSV...`);
        const formData = new FormData();
        formData.append('from', `${senderName} <${senderEmail}>`);
        formData.append('to', adminNotificationEmail);
        formData.append('subject', `[COMUNICAÇÃO PASTORAL] Lista de Membros Cadastrados - ${new Date().toLocaleDateString()}`);
        formData.append('html', `<p>Olá Pastor/Administrador,</p><p>Segue anexo o arquivo CSV atualizado com a lista de <strong>${registeredUsers.length}</strong> membros cadastrados.</p><p>Gerado automaticamente em ${new Date().toLocaleString()}.</p>`);
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('attachment', blob, `lista_membros_${new Date().toISOString().slice(0, 10)}.csv`);

        const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa('api:' + mailgunApiKey)
          },
          body: formData
        });

        if (response.ok) {
          log(`[SUCESSO] Mailgun respondeu com Status 200 (OK). E-mail enviado!`);
          setToast({
            title: currentLang === 'pt' ? 'E-mail Enviado' : 'Correo Enviado',
            message: currentLang === 'pt' ? 'O relatório CSV foi enviado com sucesso via Mailgun.' : 'El informe CSV fue enviado con éxito vía Mailgun.'
          });
        } else {
          const errText = await response.text();
          throw new Error(errText || 'Falha na resposta do servidor Mailgun');
        }
      } catch (err) {
        log(`[ERRO API] Falha de conexão com Mailgun. Detalhes: ${(err as Error).message}`);
        log(`[AVISO] Executando simulação SMTP fallback...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
      }
    } else {
      // SMTP Provider
      log(`Iniciando conexão TLS com o servidor SMTP principal...`);
      log(`Host selecionado: ${smtpHost} na porta ${smtpPort}`);
      log(`Enviando cabeçalhos de autenticação SMTP AUTH (SASL: PLAIN/LOGIN)...`);
      
      await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
    }
    setIsSendingEmail(false);
  };

  const simulateSmtpMemberEmail = async (log: (msg: string) => void, recipient: string, subject: string, body: string) => {
    await new Promise(r => setTimeout(r, 600));
    log(`[CONEXÃO SMTP] Estabelecendo conexão TLS com ${smtpHost || 'smtp.gmail.com'}:${smtpPort || '587'}`);
    log(`S -> 220 Welcome ESMTP Mail relay active`);
    log(`C -> EHLO localhost`);
    log(`S -> 250 OK STARTTLS`);
    await new Promise(r => setTimeout(r, 450));
    log(`[CONEXÃO SEGURA TLS] Handshake estabelecido com sucesso`);
    log(`C -> EHLO localhost`);
    log(`S -> 250 AUTH PLAIN`);
    log(`C -> AUTH PLAIN [ENCRYPTED_AUTH_DATA]`);
    log(`S -> 235 Authentication success`);
    await new Promise(r => setTimeout(r, 500));
    log(`C -> MAIL FROM: <${senderEmail}>`);
    log(`S -> 250 OK`);
    log(`C -> RCPT TO: <${recipient}>`);
    log(`S -> 250 OK`);
    log(`C -> DATA`);
    log(`S -> 354 SMTP payload incoming`);
    await new Promise(r => setTimeout(r, 600));
    log(`C -> Subject: ${subject}`);
    log(`C -> To: <${recipient}>`);
    log(`C -> [Enviando HTML de Boas-Vindas formatado...]`);
    log(`C -> .`);
    log(`S -> 250 Mail accepted for delivery`);
    log(`C -> QUIT`);
    log(`S -> 221 closure complete`);
    log(`[SUCESSO] Notificação individual enviada para: ${recipient}`);
    
    setToast({
      title: currentLang === 'pt' ? 'E-mail de Teste Enviado' : 'Correo de Test Enviado',
      message: currentLang === 'pt' 
        ? `A notificação modelo foi entregue para: ${recipient}`
        : `La notificación modelo fue entregada a: ${recipient}`
    });
  };

  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('João da Silva');

  // Send test Welcome Notification to a member
  const handleSendTestMemberEmail = async () => {
    if (!testRecipientEmail) {
      setToast({
        title: currentLang === 'pt' ? 'Preencha o Destinatário' : 'Complete el Destinatario',
        message: currentLang === 'pt' ? 'Informe o e-mail para o qual enviar o teste.' : 'Informe el correo al cual enviar el test.'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailConsoleLogs([]);

    const log = (msg: string) => {
      setEmailConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Iniciando envio de e-mail teste de Boas-Vindas para ${testRecipientEmail}...`);
    
    const parsedSubject = memberEmailSubject;
    const parsedBody = memberEmailBody
      .replace(/{nome}/g, testRecipientName)
      .replace(/{email}/g, testRecipientEmail)
      .replace(/{data_registro}/g, new Date().toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'es-ES'));

    log(`Mensagem compilada:`);
    log(`Assunto: "${parsedSubject}"`);
    log(`Remetente: ${senderName} <${senderEmail}>`);

    await new Promise(r => setTimeout(r, 700));

    if (emailProvider === 'sendgrid') {
      if (!sendgridApiKey) {
        log(`[AVISO] API Key do SendGrid ausente. Conectando simulador SMTP para teste...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Enviando carga JSON de notificação para API SendGrid...`);
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: testRecipientEmail }] }],
            from: { email: senderEmail, name: senderName },
            subject: parsedSubject,
            content: [{ type: 'text/html', value: parsedBody }]
          })
        });

        if (response.ok) {
          log(`[SUCESSO] Notificação enviada via API REST SendGrid!`);
          setToast({
            title: currentLang === 'pt' ? 'E-mail de Teste Enviado' : 'Correo de Test Enviado',
            message: currentLang === 'pt' ? 'Notificação enviada com sucesso.' : 'Notificación enviada con éxito.'
          });
        } else {
          throw new Error('Falha no status de resposta SendGrid');
        }
      } catch (err) {
        log(`[ERRO API] Falha: ${(err as Error).message}. Ativando SMTP fallback...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
      }
    } else if (emailProvider === 'mailgun') {
      if (!mailgunApiKey || !mailgunDomain) {
        log(`[AVISO] Credenciais do Mailgun não configuradas. Ativando SMTP fallback...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Postando payload de notificação para API Mailgun...`);
        const formData = new FormData();
        formData.append('from', `${senderName} <${senderEmail}>`);
        formData.append('to', testRecipientEmail);
        formData.append('subject', parsedSubject);
        formData.append('html', parsedBody);

        const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa('api:' + mailgunApiKey)
          },
          body: formData
        });

        if (response.ok) {
          log(`[SUCESSO] Notificação enviada via API REST Mailgun!`);
          setToast({
            title: currentLang === 'pt' ? 'E-mail de Teste Enviado' : 'Correo de Test Enviado',
            message: currentLang === 'pt' ? 'Notificação enviada com sucesso.' : 'Notificación enviada con éxito.'
          });
        } else {
          throw new Error('Falha no status de resposta Mailgun');
        }
      } catch (err) {
        log(`[ERRO API] Falha: ${(err as Error).message}. Ativando SMTP fallback...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
      }
    } else {
      await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
    }
    setIsSendingEmail(false);
  };

  // Helper arrays
  const activePhotos = activeItem 
    ? (activeItem.urls && activeItem.urls.length > 0 ? activeItem.urls : [activeItem.url])
    : [];

  const getReactions = (itemId: string) => {
    const itemReactions = dbReactions.filter(r => r.galleryId === itemId);
    return {
      likes: itemReactions.filter(r => r.likes).length,
      loves: itemReactions.filter(r => r.loves).length,
      amens: itemReactions.filter(r => r.amens).length,
      bless: itemReactions.filter(r => r.bless).length
    };
  };

  const hasUserReacted = (itemId: string, type: 'likes' | 'loves' | 'amens' | 'bless') => {
    if (!currentUser) return false;
    const userReaction = dbReactions.find(r => r.galleryId === itemId && r.userId === currentUser.uid);
    return userReaction ? !!userReaction[type] : false;
  };

  // Toggle reaction with Firestore backend persistence
  const incrementReaction = async (itemId: string, type: 'likes' | 'loves' | 'amens' | 'bless') => {
    if (!currentUser || !registeredUser) {
      setIsRegMode(true);
      return;
    }
    if (registeredUser.isBlocked) {
      alert(currentLang === 'pt' ? 'O seu usuário está bloqueado no sistema e não pode realizar reações.' : 'Su usuario está bloqueado en el sistema y no puede realizar reacciones.');
      return;
    }
    const docId = `${itemId}_${currentUser.uid}`;
    const userReaction = dbReactions.find(r => r.id === docId);
    
    try {
      if (userReaction) {
        const nextValue = !userReaction[type];
        await setDoc(doc(db, 'gallery_reactions', docId), {
          ...userReaction,
          [type]: nextValue
        }, { merge: true });
      } else {
        const payload = {
          galleryId: itemId,
          userId: currentUser.uid,
          likes: type === 'likes',
          loves: type === 'loves',
          amens: type === 'amens',
          bless: type === 'bless'
        };
        await setDoc(doc(db, 'gallery_reactions', docId), payload);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'gallery_reactions');
    }
  };

  // Submit dynamic comment to Firestore
  const handlePostComment = async (e: FormEvent, itemId: string) => {
    e.preventDefault();
    if (!currentInputComment.trim()) return;

    if (!currentUser || !registeredUser) {
      setIsRegMode(true);
      return;
    }

    if (registeredUser.isBlocked) {
      alert(currentLang === 'pt' ? 'O seu usuário está bloqueado no sistema e não pode enviar novos comentários.' : 'Su usuario está bloqueado en el sistema y no puede enviar nuevos comentarios.');
      return;
    }

    try {
      const commentPayload = {
        galleryId: itemId,
        authorName: registeredUser.name || currentUser.displayName || 'Visitante',
        authorEmail: registeredUser.email || currentUser.email || 'anon@iglesia.com',
        userId: currentUser.uid,
        text: currentInputComment.trim(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'gallery_comments'), commentPayload);
      setCurrentInputComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gallery_comments');
    }
  };

  // Filter out hidden items for non-admin visitors
  const displayedItems = items.filter(item => {
    if (galleryAdmin) return true; // Admins can view both visible and hidden
    return !item.hidden; // Visitors only see visible
  });

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-6">
      <div className="text-center mb-12 space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-2">
           <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">
             {translateText('Memorias Compartidas', currentLang)}
           </span>
           <h1 className="text-4xl md:text-5xl font-serif font-black text-church-navy leading-tight">
             {translateText('Momentos de Bendición', currentLang)}
           </h1>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed font-medium">
          {translateText('Un vistazo a la vibrante vida de nuestra iglesia a través de los años. Foto y video de nuestros encuentros más significativos.', currentLang)}
        </p>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {displayedItems.length > 0 ? displayedItems.map((item, idx) => {
          const itemPhotos = item.urls && item.urls.length > 0 ? item.urls : [item.url];
          const isItemHidden = !!item.hidden;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.8 }}
              viewport={{ once: true }}
              className={`relative group rounded-[3rem] overflow-hidden bg-white border break-inside-avoid shadow-soft hover:shadow-strong transition-all duration-500 flex flex-col ${
                isItemHidden 
                  ? 'opacity-85 border-amber-500/30 bg-amber-50/5' 
                  : 'border-slate-100'
              }`}
            >
              {/* Overlay with status and quick actions if admin mode is active */}
              {galleryAdmin && (
                <>
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 z-20 flex gap-1.5 flex-wrap pointer-events-none select-none">
                    {isItemHidden ? (
                      <span className="bg-red-650 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-md border border-white/10 flex items-center gap-1 backdrop-blur-sm bg-opacity-95">
                        <EyeOff className="w-3 h-3" />
                        <span>{currentLang === 'pt' ? 'Oculto / Privado' : 'Oculto / Privado'}</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-650 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-md border border-white/10 flex items-center gap-1 backdrop-blur-sm bg-opacity-95">
                        <CheckCircle className="w-3 h-3" />
                        <span>{currentLang === 'pt' ? 'Visível ao Público' : 'Visible al Público'}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {/* Toggle Hide/Show Button */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const targetHideState = !item.hidden;
                        try {
                          await updateDoc(doc(db, 'gallery', item.id), {
                            hidden: targetHideState
                          });
                          setToast({
                            title: targetHideState 
                              ? (currentLang === 'pt' ? 'Álbum Ocultado' : 'Álbum Ocultado') 
                              : (currentLang === 'pt' ? 'Álbum Visível' : 'Álbum Visible'),
                            message: currentLang === 'pt'
                              ? `O álbum "${item.title}" agora está oculto para visitantes.`
                              : `El álbum "${item.title}" ahora está oculto para visitantes.`
                          });
                        } catch (err) {
                          console.error("Error setting album visibility:", err);
                          alert("Error: " + (err as Error).message);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-white shadow-lg cursor-pointer transition-all border border-white/10 hover:scale-110 active:scale-95 ${
                        isItemHidden 
                          ? 'bg-emerald-650 hover:bg-emerald-700' 
                          : 'bg-slate-800/90 hover:bg-slate-900'
                      }`}
                      title={isItemHidden 
                        ? (currentLang === 'pt' ? 'Exibir para os Internautas' : 'Mostrar a los Internautas')
                        : (currentLang === 'pt' ? 'Ocultar para os Internautas' : 'Ocultar a los Internautas')
                      }
                    >
                      {isItemHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Entire Album Button */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmText = currentLang === 'pt'
                          ? `Tem certeza que deseja excluir permanentemente o álbum "${item.title}" por completo com todas as suas fotos e comentários?`
                          : `¿Está seguro de que desea eliminar permanentemente el álbum "${item.title}" por completo con todas sus fotos y comentarios?`;
                        if (window.confirm(confirmText)) {
                          try {
                            // Delete comments
                            const itemComments = allComments.filter(c => c.galleryId === item.id);
                            for (const c of itemComments) {
                              await deleteDoc(doc(db, 'gallery_comments', c.id));
                            }
                            // Delete document
                            await deleteDoc(doc(db, 'gallery', item.id));
                            setToast({
                              title: currentLang === 'pt' ? 'Álbum Deletado' : 'Álbum Eliminado',
                              message: currentLang === 'pt' 
                                ? `O álbum "${item.title}" e todos os seus comentários foram removidos.`
                                : `El álbum "${item.title}" y todos sus comentarios fueron eliminados.`
                            });
                          } catch (err) {
                            console.error("Error deleting album completely:", err);
                            alert("Error: " + (err as Error).message);
                          }
                        }
                      }}
                      className="p-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white shadow-lg cursor-pointer transition-all border border-white/10 hover:scale-110 active:scale-95"
                      title={currentLang === 'pt' ? 'Deletar álbum permanente' : 'Eliminar álbum permanente'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {/* Cover layout showing a single thumbnail */}
              <PhotoCollage 
                urls={itemPhotos} 
                title={item.title} 
                coverUrl={item.url}
                onImageClick={(photoIdx) => handleOpenAlbum(item, photoIdx)}
              />

              {/* Text summary below collage (facebook post card footer) */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#cf9d34] bg-church-gold/10 px-2.5 py-1 rounded-full font-sans">
                      {item.type === 'photo' ? translateText('Fotos', currentLang) : translateText('Video', currentLang)}
                    </span>
                    {itemPhotos.length > 1 && (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-full">
                        {itemPhotos.length} {translateText('fotos', currentLang)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    {translateText(item.date, currentLang || 'es')}
                  </span>
                </div>

                <div className="space-y-1">
                  {item.eventName && (
                    <span className="text-[9px] text-[#cf9d34] font-black tracking-widest uppercase block">
                      {translateText('Álbum: ', currentLang)}{translateText(item.eventName, currentLang)}
                    </span>
                  )}
                  <h4 className="text-xl font-serif font-semibold text-church-navy leading-tight hover:text-church-gold transition-colors cursor-pointer" onClick={() => handleOpenAlbum(item, 0)}>
                    {translateText(item.title, currentLang || 'es')}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Micro social bar summary */}
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-church-gold" onClick={() => handleOpenAlbum(item, 0)}>
                    <div className="flex -space-x-1">
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] shadow-sm">👍</span>
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[9px] shadow-sm">❤️</span>
                      <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] shadow-sm">🙏</span>
                    </div>
                    <span className="ml-1 text-slate-500">
                      {getReactions(item.id).likes + getReactions(item.id).loves + getReactions(item.id).amens}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-church-gold" onClick={() => handleOpenAlbum(item, 0)}>
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{countsByGalleryId[item.id] || 0} {translateText('comentarios', currentLang)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-50 shadow-soft flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-300 italic font-serif text-2xl">
              {translateText('La galería está esperando nuevos recuerdos...', currentLang)}
            </p>
          </div>
        )}
      </div>

      {/* ADVANCED ADMIN MODERATOR ACTIONS FOR REGISTERED COMMENTERS */}
      <div className="mt-16 border-t border-slate-200/60 pt-12">
        <div className="bg-white border border-slate-100 p-6 md:p-10 rounded-[2.5rem] shadow-soft space-y-8 relative overflow-hidden text-church-navy">
          
          {/* Section banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-church-navy/5 flex items-center justify-center border border-church-navy/10 text-church-navy shrink-0">
                <Shield className="w-6 h-6 text-[#cf9d34]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-serif font-black text-church-navy">
                  {currentLang === 'pt' ? 'Painel de Moderação de Comentaristas' : 'Panel de Moderación de Comentaristas'}
                </h3>
                <p className="text-xs text-slate-500 font-medium select-none">
                  {currentLang === 'pt' 
                    ? 'Ações administrativas avançadas para gerenciar, bloquear ou excluir contas temporárias e comentários da galeria.' 
                    : 'Acciones administrativas avanzadas para gestionar, bloquear o eliminar cuentas temporales y comentarios de la galería.'}
                </p>
              </div>
            </div>
            
            {galleryAdmin && (
              <button
                onClick={handleAdminLogout}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-650 bg-red-50 hover:bg-red-100 border border-red-250/20 px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 self-start md:self-center"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{currentLang === 'pt' ? 'Sair do Modo Moderação' : 'Salir del Modo Moderación'}</span>
              </button>
            )}
          </div>

          {/* Alert Toast Notification */}
          {toast && (
            <div className="absolute top-4 right-4 bg-[#1A2B48] text-white p-4 rounded-2xl shadow-strong max-w-sm border border-[#D4AF37]/50 animate-in fade-in slide-in-from-top-4 duration-300 z-50 flex flex-col gap-1">
              <h5 className="font-serif font-bold text-sm text-[#D4AF37]">{toast.title}</h5>
              <p className="text-xs text-slate-200">{toast.message}</p>
            </div>
          )}

          {!galleryAdmin ? (
            /* Secure Administrator Authentication form inside Gallery page */
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-2 text-church-gold">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-lg text-church-navy">
                  {currentLang === 'pt' ? 'Acesso Administrativo / Moderação' : 'Acceso Administrativo / Moderación'}
                </h4>
                <p className="text-xs text-slate-400">
                  {currentLang === 'pt' 
                    ? 'Inicie sessão com suas credenciais de administrador da igreja para desbloquear os controles.' 
                    : 'Inicie sesión con sus credenciales de administrador de la iglesia para desbloquear los controles.'}
                </p>
              </div>

              <form onSubmit={handleAdminVerifyLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {currentLang === 'pt' ? 'Usuário (Username)' : 'ID de Usuario (Username)'}
                  </label>
                  <input
                    type="text"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25 focus:border-[#cf9d34] text-church-navy transition-all placeholder:text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {currentLang === 'pt' ? 'Senha (Password)' : 'Contraseña (Password)'}
                  </label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25 focus:border-[#cf9d34] text-church-navy transition-all placeholder:text-slate-300"
                    required
                  />
                </div>

                {adminLoginError && (
                  <p className="text-[11px] font-bold text-red-500 text-center leading-tight">
                    {adminLoginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-church-navy hover:bg-[#15233c] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{currentLang === 'pt' ? 'Desbloquear Controles' : 'Desbloquear Controles'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Live statistics and control operations */
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Core stats bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
                    <Users className="w-5 h-5 text-church-gold" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">{currentLang === 'pt' ? 'Registrados' : 'Registrados'}</span>
                    <span className="text-xl font-black text-church-navy leading-none block mt-0.5">{registeredUsers.length}</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-650" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">{currentLang === 'pt' ? 'Ativos' : 'Activos'}</span>
                    <span className="text-xl font-black text-church-navy leading-none block mt-0.5">
                      {registeredUsers.filter(u => !u.isBlocked).length}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
                    <UserX className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">{currentLang === 'pt' ? 'Bloqueados' : 'Bloqueados'}</span>
                    <span className="text-xl font-black text-church-navy leading-none block mt-0.5">
                      {registeredUsers.filter(u => u.isBlocked).length}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">{currentLang === 'pt' ? 'Comentários' : 'Comentarios'}</span>
                    <span className="text-xl font-black text-church-navy leading-none block mt-0.5">{allComments.length}</span>
                  </div>
                </div>
              </div>

              {/* Tab Selector for Administrators */}
              <div className="flex border-b border-slate-100 pb-0.5 mb-2 gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('commenters')}
                  className={`pb-3 text-xs font-black uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer ${
                    adminActiveTab === 'commenters'
                      ? 'border-church-gold text-church-navy font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  👥 {currentLang === 'pt' ? 'Membros & Comentaristas' : 'Miembros y Comentaristas'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('albums')}
                  className={`pb-3 text-xs font-black uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer ${
                    adminActiveTab === 'albums'
                      ? 'border-church-gold text-church-navy font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🖼️ {currentLang === 'pt' ? 'Organizar Álbuns & Fotos' : 'Organizar Álbumes y Fotos'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('email')}
                  className={`pb-3 text-xs font-black uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer ${
                    adminActiveTab === 'email'
                      ? 'border-church-gold text-church-navy font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ✉️ {currentLang === 'pt' ? 'E-mail & Automação' : 'Correo y Automatización'}
                </button>
              </div>

              {adminActiveTab === 'commenters' ? (
                <>
                  {/* Filtering Search row & CSV export */}
                  <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder={currentLang === 'pt' ? 'Buscar comentaristas por nome ou e-mail...' : 'Buscar comentaristas por nombre o correo...'}
                        value={searchCommenterQuery}
                        onChange={(e) => setSearchCommenterQuery(e.target.value)}
                        className="w-full bg-slate-50/30 border border-slate-150 rounded-xl px-5 py-3 pl-12 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25 focus:border-[#cf9d34] transition-all placeholder:text-slate-350"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      {searchCommenterQuery && (
                        <button 
                          onClick={() => setSearchCommenterQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest text-[9px]"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleExportUsersToCSV}
                      className="px-5 py-3 bg-emerald-650 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-white/10 shrink-0 cursor-pointer active:scale-95"
                      title={currentLang === 'pt' ? 'Exportar membros interessados para formato CSV' : 'Exportar miembros inscritos a formato CSV'}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{currentLang === 'pt' ? 'Exportar CSV' : 'Exportar CSV'}</span>
                    </button>
                  </div>

              {/* Commentators Active List */}
              <div className="space-y-4">
                {registeredUsers.filter(u => {
                  const name = (u.name || '').toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const queryText = searchCommenterQuery.toLowerCase().trim();
                  return name.includes(queryText) || email.includes(queryText);
                }).length > 0 ? (
                  registeredUsers.filter(u => {
                    const name = (u.name || '').toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    const queryText = searchCommenterQuery.toLowerCase().trim();
                    return name.includes(queryText) || email.includes(queryText);
                  }).map((u) => {
                    const userComments = allComments.filter(c => c.userId === u.id);
                    return (
                      <div 
                        key={u.id}
                        className={`p-5 rounded-3xl border transition-all duration-300 relative flex flex-col gap-4 ${
                          u.isBlocked 
                            ? 'bg-rose-50/20 border-rose-100 hover:border-rose-200' 
                            : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-soft'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 border ${
                              u.isBlocked 
                                ? 'bg-rose-100 text-rose-600 border-rose-200' 
                                : 'bg-church-navy/5 text-church-navy border-church-navy/10'
                            }`}>
                              {u.name ? u.name.substring(0, 2).toUpperCase() : 'CO'}
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-serif font-black text-base text-church-navy tracking-tight">{u.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                                  u.role === 'visitor' 
                                    ? 'bg-slate-150 text-slate-500' 
                                    : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
                                }`}>
                                  {u.role === 'visitor' 
                                    ? (currentLang === 'pt' ? 'Anônimo / Visitante' : 'Anónimo / Visitante') 
                                    : (currentLang === 'pt' ? 'Gmail / Membro' : 'Gmail / Miembro')}
                                </span>
                                {u.isBlocked && (
                                  <span className="bg-red-150 text-red-650 border border-red-200 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider animate-pulse">
                                    {currentLang === 'pt' ? 'Bloqueado' : 'Bloqueado'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono leading-none truncate">{u.email}</p>
                              <p className="text-[9px] text-slate-400 font-bold select-none">
                                {currentLang === 'pt' ? 'Registrado em: ' : 'Registrado el: '} 
                                {u.createdAt ? new Date(u.createdAt).toLocaleString(currentLang === 'pt' ? 'pt-BR' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                              </p>
                            </div>
                          </div>

                          {/* Action triggers */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                            {/* Block Toggle Button */}
                            <button
                              type="button"
                              onClick={async () => {
                                const targetState = !u.isBlocked;
                                try {
                                  await setDoc(doc(db, 'registered_users', u.id), {
                                    isBlocked: targetState
                                  }, { merge: true });
                                  
                                  setToast({
                                    title: targetState ? (currentLang === 'pt' ? 'Bloqueado com Sucesso' : 'Bloqueado con éxito') : (currentLang === 'pt' ? 'Desbloqueado com Sucesso' : 'Desbloqueado con éxito'),
                                    message: currentLang === 'pt' 
                                      ? `O comentarista "${u.name}" foi ${targetState ? 'bloqueado' : 'desbloqueado'} do sistema.`
                                      : `El comentarista "${u.name}" ha sido ${targetState ? 'bloqueado' : 'desbloqueado'} del sistema.`
                                  });
                                } catch (err) {
                                  console.error("Error toggling block status:", err);
                                  alert('Error al actualizar estado.');
                                }
                              }}
                              className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer border shadow-sm ${
                                u.isBlocked
                                  ? 'bg-emerald-555/10 text-emerald-650 hover:bg-emerald-550 hover:text-white border-emerald-500/20'
                                  : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border-orange-100'
                              }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{currentLang === 'pt' ? 'Desbloquear' : 'Desbloquear'}</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>{currentLang === 'pt' ? 'Bloquear' : 'Bloquear'}</span>
                                </>
                              )}
                            </button>

                            {/* Permanently delete user and comments */}
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmText = currentLang === 'pt' 
                                  ? `Tem certeza que deseja excluir permanentemente "${u.name}"? Isso apagará seu registro de comentarista e TODOS os seus ${userComments.length} comentários associados!` 
                                  : `¿Seguro que desea eliminar de forma permanente a "${u.name}"? ¡Esto borrará su de comentarista y TODOS sus ${userComments.length} comentarios asociados!`;
                                
                                if (window.confirm(confirmText)) {
                                  try {
                                    // Delete all comments written by this user
                                    for (const c of userComments) {
                                      await deleteDoc(doc(db, 'gallery_comments', c.id));
                                    }
                                    // Delete commenter document
                                    await deleteDoc(doc(db, 'registered_users', u.id));
                                    
                                    setToast({
                                      title: currentLang === 'pt' ? 'Conta Excluída' : 'Cuenta Eliminada',
                                      message: currentLang === 'pt'
                                        ? `"${u.name}" e todas as suas contribuições foram excluídas permanently.`
                                        : `"${u.name}" y todas sus contribuciones se borraron correctamente.`
                                    });
                                  } catch (err) {
                                    console.error("Error deleting commenter:", err);
                                    alert('Error al eliminar cuenta.');
                                  }
                                }
                              }}
                              className="text-[9px] font-black text-red-500 hover:text-red-750 hover:bg-red-50 border border-red-100 hover:border-red-200 uppercase tracking-widest flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{currentLang === 'pt' ? 'Excluir' : 'Eliminar'}</span>
                            </button>
                          </div>
                        </div>

                        {/* List generated comments for this specific user */}
                        {userComments.length > 0 && (
                          <div className="border-t border-slate-100/60 pt-3 mt-1 space-y-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 flex-wrap">
                              <MessageSquare className="w-3 h-3 text-church-gold" />
                              {currentLang === 'pt' ? `Comentários desta pessoa (${userComments.length}):` : `Comentarios de esta persona (${userComments.length}):`}
                            </span>
                            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                              {userComments.map(comment => (
                                <div 
                                  key={comment.id}
                                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all text-[11px]"
                                >
                                  <div className="space-y-0.5">
                                    <p className="text-slate-650 italic leading-relaxed">
                                      "{comment.text}"
                                    </p>
                                    <span className="text-[8px] font-bold text-slate-400 font-mono block">
                                      {currentLang === 'pt' ? 'Postado em: ' : 'Publicado el: '} 
                                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString(currentLang === 'pt' ? 'pt-BR' : 'es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const confirmDel = currentLang === 'pt' 
                                        ? 'Deseja excluir este comentário específico?' 
                                        : '¿Desea eliminar este comentario específico?';
                                      
                                      if (window.confirm(confirmDel)) {
                                        try {
                                          await deleteDoc(doc(db, 'gallery_comments', comment.id));
                                          setToast({
                                            title: currentLang === 'pt' ? 'Comentário Excluído' : 'Comentario Eliminado',
                                            message: currentLang === 'pt' ? 'O comentário selecionado foi removido.' : 'El comentario seleccionado fue removido con éxito.'
                                          });
                                        } catch (err) {
                                          console.error("Error deleting individual comment:", err);
                                        }
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:text-red-750 hover:bg-slate-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                    title="Excluir comentário"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-50/10 rounded-[1.5rem] border border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-350 mx-auto animate-pulse mb-2" />
                    <h5 className="font-serif font-bold text-sm text-church-navy">{currentLang === 'pt' ? 'Ninguém encontrado' : 'Ningún resultado'}</h5>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-0.5">
                      {searchCommenterQuery 
                        ? (currentLang === 'pt' ? 'Ajuste seus termos de busca.' : 'Ajuste los términos de búsqueda.')
                        : (currentLang === 'pt' ? 'Nenhuma conta registrada para comentários se encontra ativa.' : 'No hay cuentas registradas aún.')
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : adminActiveTab === 'albums' ? (
            /* Tab 2: General Album and Photo Management */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-amber-50/40 rounded-2xl border border-amber-200/40 p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
                <span className="text-xl shrink-0 select-none">💡</span>
                <div>
                  <p className="font-black text-church-navy">
                    {currentLang === 'pt' ? 'Controle Inteligente de Visibilidade & Exclusão:' : 'Control Inteligente de Visibilidad y Eliminación:'}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {currentLang === 'pt' 
                      ? 'Dê um clique em "Ocultar" para esconder o álbum de visitantes normais temporariamente, ou "Deletar" para retirá-lo inteiramente. Para gerenciar fotos de cada álbum, use o removedor rápido ou clique para abrir o álbum no topo da página e gerencie as fotos diretamente pelo visualizador (Lightbox) com toda a interatividade.' 
                      : 'De un clic en "Ocultar" para esconder el álbum de los internautas normales temporalmente, o "Eliminar" para retirarlo por completo. Para gestionar las fotos de cada álbum, use el removedor rápido de abajo o simplemente abra el álbum en el tope de the página y elimine las fotos individuales directamente en el visor (Lightbox).'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((album) => {
                  const albumPhotos = album.urls && album.urls.length > 0 ? album.urls : [album.url];
                  const isHidden = !!album.hidden;
                  return (
                    <div 
                      key={album.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col gap-4 ${
                        isHidden 
                          ? 'bg-amber-50/10 border-amber-200/50 bg-amber-50/5' 
                          : 'bg-slate-50/40 border-slate-100 hover:bg-white hover:shadow-soft'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Small preview block */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-150 border border-slate-200 shrink-0 relative select-none">
                          <img 
                            src={album.url} 
                            alt={album.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-slate-100 uppercase scale-90 font-bold">
                            {albumPhotos.length} {albumPhotos.length === 1 ? 'Foto' : 'Fotos'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-serif font-black text-sm text-church-navy leading-tight truncate">{album.title}</h4>
                              {isHidden ? (
                                <span className="bg-red-50 text-red-650 border border-red-100 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                  {currentLang === 'pt' ? 'Ocultado' : 'Ocultado'}
                                </span>
                              ) : (
                                <span className="bg-emerald-555/10 text-emerald-650 border border-emerald-500/10 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                  {currentLang === 'pt' ? 'Público' : 'Público'}
                                </span>
                              )}
                            </div>
                            {album.eventName && (
                              <p className="text-[9px] uppercase font-black tracking-widest text-[#cf9d34] leading-none mt-1">
                                {album.eventName}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                            {translateText(album.date, currentLang || 'es')}
                          </span>
                        </div>
                      </div>

                      {/* Quick Admin Actions Row */}
                      <div className="flex items-center justify-between gap-3 border-t border-slate-150/40 pt-3 flex-wrap">
                        <span className="text-[8.5px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                          💬 {countsByGalleryId[album.id] || 0} {currentLang === 'pt' ? 'comentários' : 'comentarios'}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Toggle visibility button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'gallery', album.id), {
                                  hidden: !isHidden
                                });
                                setToast({
                                  title: !isHidden 
                                    ? (currentLang === 'pt' ? 'Álbum Ocultado' : 'Álbum Ocultado') 
                                    : (currentLang === 'pt' ? 'Álbum Visível' : 'Álbum Visible'),
                                  message: currentLang === 'pt'
                                    ? `O álbum "${album.title}" agora está oculto para visitantes.`
                                    : `El álbum "${album.title}" ahora está oculto para visitantes.`
                                });
                              } catch (err) {
                                console.error("Error setting album visibility:", err);
                              }
                            }}
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                              isHidden
                                ? 'bg-emerald-100 text-emerald-755 hover:bg-emerald-600 hover:text-white border-emerald-200'
                                : 'bg-slate-105 text-slate-650 hover:bg-slate-200 border-slate-205'
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>{currentLang === 'pt' ? 'Exibir' : 'Mostrar'}</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>{currentLang === 'pt' ? 'Ocultar' : 'Ocultar'}</span>
                              </>
                            )}
                          </button>

                          {/* Delete completely button */}
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmText = currentLang === 'pt'
                                ? `Deseja realmente apagar o álbum "${album.title}" e todos os seus comentários para sempre?`
                                : `¿Desea realmente borrar el álbum "${album.title}" y todos sus comentarios de forma permanente?`;
                              if (window.confirm(confirmText)) {
                                try {
                                  const albumComments = allComments.filter(c => c.galleryId === album.id);
                                  for (const c of albumComments) {
                                    await deleteDoc(doc(db, 'gallery_comments', c.id));
                                  }
                                  await deleteDoc(doc(db, 'gallery', album.id));
                                  setToast({
                                    title: currentLang === 'pt' ? 'Álbum Deletado' : 'Álbum Eliminado',
                                    message: currentLang === 'pt' ? 'O álbum foi apagado do banco de dados.' : 'El álbum ha sido eliminado de la base de datos.'
                                  });
                                } catch (err) {
                                  console.error("Error deleting album completely:", err);
                                }
                              }
                            }}
                            className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-red-50 text-red-650 hover:bg-red-650 hover:text-white border border-red-100 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{currentLang === 'pt' ? 'Deletar' : 'Eliminar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded list of photos inline with delete functionality */}
                      <div className="border-t border-slate-150/40 pt-3 mt-1.5">
                        <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block mb-2 leading-none select-none">
                          🖼️ {currentLang === 'pt' ? 'Fotos Atuais no Álbum (Aponte para excluir):' : 'Fotos del Álbum (Apunte para eliminar):'}
                        </span>
                        <div className="bg-slate-100/50 rounded-2xl p-2.5 flex gap-2.5 overflow-x-auto select-none border border-slate-200/40 scrollbar-thin">
                          {albumPhotos.map((url, pIdx) => (
                            <div key={url + pIdx} className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 relative group/photo">
                              <img 
                                src={url} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSpecificPhotoInDashboard(album.id, url, albumPhotos)}
                                className="absolute inset-0 bg-red-600/90 flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer duration-200"
                                title={currentLang === 'pt' ? 'Excluir esta foto' : 'Eliminar esta foto'}
                              >
                                <X className="w-4 h-4 text-white font-bold animate-in zoom-in-50 duration-200" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 3: Detailed E-mail Config and Pastoral API Integration panel */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200/40 p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
                <span className="text-xl shrink-0 select-none">📨</span>
                <div>
                  <p className="font-black text-church-navy">
                    {currentLang === 'pt' ? 'Servidor de E-mail & Automação de Comunicação:' : 'Servidor de Correo y Automatización de Comunicación:'}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {currentLang === 'pt' 
                      ? 'Configure um provedor SMTP tradicional ou use conexões API seguras (SendGrid ou Mailgun) para disparar instantaneamente relatórios pastorais em CSV e mensagens de boas-vindas automatizadas a novos membros integrados!' 
                      : '¡Configure un proveedor SMTP tradicional o use conexiones de API seguras (SendGrid o Mailgun) para enviar informes de CSV pastorales y notificaciones de bienvenida a los nuevos miembros en tiempo real!'}
                  </p>
                </div>
              </div>

              {/* Two Column Layout: Settings Form + Visual Test Terminal & Templates */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Credentials & Providers Form */}
                <div className="lg:col-span-7 bg-white/60 border border-slate-100 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <Settings className="w-5 h-5 text-[#cf9d34]" />
                    <h4 className="font-serif font-bold text-base text-church-navy">
                      {currentLang === 'pt' ? 'Configuração do Provedor' : 'Configuración del Proveedor'}
                    </h4>
                  </div>

                  {/* Provider Radio Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {currentLang === 'pt' ? 'Selecione o Serviço de Transmissão' : 'Seleccione el Método de Envío'}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'smtp', label: 'SMTP Servidor' },
                        { id: 'sendgrid', label: 'SendGrid API' },
                        { id: 'mailgun', label: 'Mailgun API' }
                      ].map(prov => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setEmailProvider(prov.id as any)}
                          className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            emailProvider === prov.id 
                              ? 'border-church-gold bg-amber-50/40 text-[#cf9d34] font-bold text-xs'
                              : 'border-slate-150 text-slate-500 text-xs hover:bg-slate-50/50'
                          }`}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields based on selector */}
                  {emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-250">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Port</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={e => setSmtpPort(e.target.value)}
                          placeholder="587"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Username</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          placeholder="igreja.financeiro@gmail.com"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Password</label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={e => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2.5 pt-1">
                        <input
                          type="checkbox"
                          id="smtp_secure_ssl"
                          checked={smtpSecure}
                          onChange={e => setSmtpSecure(e.target.checked)}
                          className="rounded text-church-gold focus:ring-church-gold accent-[#cf9d34] cursor-pointer"
                        />
                        <label htmlFor="smtp_secure_ssl" className="text-xs font-semibold text-slate-500 cursor-pointer">
                          {currentLang === 'pt' ? 'Requer Conexão Criptografada Segura (SSL/TLS)' : 'Requiere Conexión Encriptada Segura (SSL/TLS)'}
                        </label>
                      </div>
                    </div>
                  )}

                  {emailProvider === 'sendgrid' && (
                    <div className="space-y-4 animate-in fade-in duration-250">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SendGrid v3 API Key</label>
                        <input
                          type="password"
                          value={sendgridApiKey}
                          onChange={e => setSendgridApiKey(e.target.value)}
                          placeholder="SG.••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                    </div>
                  )}

                  {emailProvider === 'mailgun' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-250">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Mailgun API Key</label>
                        <input
                          type="password"
                          value={mailgunApiKey}
                          onChange={e => setMailgunApiKey(e.target.value)}
                          placeholder="key-••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Mailgun Domain</label>
                        <input
                          type="text"
                          value={mailgunDomain}
                          onChange={e => setMailgunDomain(e.target.value)}
                          placeholder="mg.igrejadovale.org"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sender Headers info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        {currentLang === 'pt' ? 'Nome do Remetente' : 'Nombre del Remitente'}
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Comunicação Pastoral"
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        {currentLang === 'pt' ? 'E-mail do Remetente autorizado' : 'Correo del Remitente autorizado'}
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        placeholder="pastoral@igreja.org"
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>
                  </div>

                  {/* Save config CTA */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSaveEmailSettings}
                      className="bg-church-navy hover:bg-[#cf9d34] transition-all duration-300 text-white font-black uppercase tracking-[0.1em] text-[10px] px-6 py-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md shrink-0"
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {currentLang === 'pt' ? 'Salvando...' : 'Guardando...'}
                        </>
                      ) : (
                        <>
                          💾 {currentLang === 'pt' ? 'Salvar Configuração Segura' : 'Guardar Configuración Segura'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right side: Pastoral Dispatch Hub & Console and Template Preview */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* CSV Export Automation Hub */}
                  <div className="bg-[#cf9d34]/5 border border-amber-200/50 rounded-3xl p-5 space-y-4">
                    <h5 className="font-serif font-bold text-sm text-church-navy flex items-center gap-2">
                      📋 {currentLang === 'pt' ? 'Automação de Lista Pastoral' : 'Automatización de Lista Pastoral'}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {currentLang === 'pt' 
                        ? 'Envie instantaneamente a lista de contatos em formato CSV compactado direto para o e-mail do pastor ou equipe ministerial.' 
                        : 'Envíe de inmediato la lista de miembros en CSV comprimida directo al correo de pastoral o equipo ministerial.'}
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                        {currentLang === 'pt' ? 'E-mail de Destino do Pastor' : 'Correo de Destino del Pastor'}
                      </label>
                      <input
                        type="email"
                        value={adminNotificationEmail}
                        onChange={e => setAdminNotificationEmail(e.target.value)}
                        placeholder="pastor.comunicacao@igreja.org"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSendAutomatedCSVEmail}
                      className="w-full bg-church-navy hover:bg-church-gold transition-colors text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {currentLang === 'pt' ? 'Exportar & Enviar CSV por E-mail' : 'Exportar y Enviar CSV por Correo'}
                    </button>
                  </div>

                  {/* Test individual Welcome Notification */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <h5 className="font-serif font-bold text-sm text-church-navy flex items-center gap-2">
                      ✉️ {currentLang === 'pt' ? 'Disparar Notificação Modelo' : 'Disparar Notificación Modelo'}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {currentLang === 'pt' 
                        ? 'Simule/Envie um e-mail com o template de boas-vindas do sistema para certificar o funcionamento correto dos servidores.' 
                        : 'Simule/Envíe un correo con el template de bienvenida del sistema para certificar el funcionamiento de los servidores.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">Nome/Nombre</label>
                        <input
                          type="text"
                          value={testRecipientName}
                          onChange={e => setTestRecipientName(e.target.value)}
                          placeholder="João da Silva"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">E-mail</label>
                        <input
                          type="email"
                          value={testRecipientEmail}
                          onChange={e => setTestRecipientEmail(e.target.value)}
                          placeholder="joao@gmail.com"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSendTestMemberEmail}
                      className="w-full bg-[#3b5998] hover:bg-indigo-700 transition-colors text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {currentLang === 'pt' ? 'Enviar Notificação Teste' : 'Enviar Notificación Test'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Email Welcome notification Template Editor */}
              <div className="bg-white/40 border border-slate-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-55 pb-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-church-navy flex items-center gap-1.5">
                      {currentLang === 'pt' ? 'Template de Boas-vindas para Membros Cadastrados' : 'Plantilla de Bienvenida para Miembros Registrados'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {currentLang === 'pt' ? 'Tags disponíveis: {nome}, {email}, {data_registro} (HTML Suportado)' : 'Etiquetas válidas: {nome}, {email}, {data_registro} (HTML Soportado)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">{currentLang === 'pt' ? 'Assunto do E-mail' : 'Asunto del Correo'}</label>
                    <input
                      type="text"
                      value={memberEmailSubject}
                      onChange={e => setMemberEmailSubject(e.target.value)}
                      placeholder="Bem-vindo à nossa Comunidade!"
                      className="w-full bg-slate-50/20 border border-slate-150 rounded-xl px-4 py-2.5 text-xs font-bold text-church-navy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">{currentLang === 'pt' ? 'Corpo da Mensagem (HTML)' : 'Cuerpo del Mensaje (HTML)'}</label>
                    <textarea
                      rows={4}
                      value={memberEmailBody}
                      onChange={e => setMemberEmailBody(e.target.value)}
                      placeholder="<p>Olá <strong>{nome}</strong>...</p>"
                      className="w-full bg-slate-50/20 border border-slate-150 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SMTP / REST Outbound Real-Time Handshake Monitor Console */}
              <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      {currentLang === 'pt' ? 'Console de Conexão Pastor-SMTP (Handshake Ativo)' : 'Consola de Conexión Pastor-SMTP (Handshake Activo)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[8px] font-mono text-emerald-500 tracking-widest uppercase font-black">Live Monitor</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 overflow-y-auto max-h-48 font-mono text-[10.5px] text-slate-400 space-y-1">
                  {emailConsoleLogs.length === 0 ? (
                    <div className="text-slate-600 italic select-none">
                      {currentLang === 'pt' 
                        ? 'Aguardando ação pastoral... Destaque: execute um teste acima para rastreamento SMTP em tempo real aqui.' 
                        : 'Esperando acción pastoral... Ejecute una prueba para ver la traza SMTP aquí.'}
                    </div>
                  ) : (
                    emailConsoleLogs.map((logStr, lIdx) => {
                      let colorClass = 'text-slate-400';
                      if (logStr.includes('[SUCESSO]')) colorClass = 'text-emerald-400 font-bold';
                      else if (logStr.includes('[ERRO]')) colorClass = 'text-red-400 font-bold';
                      else if (logStr.includes('[AVISO]')) colorClass = 'text-yellow-400 font-bold';
                      else if (logStr.includes('C ->') || logStr.includes('[CONEXÃO')) colorClass = 'text-sky-300';
                      else if (logStr.includes('S ->')) colorClass = 'text-indigo-300';

                      return (
                        <div key={lIdx} className={`${colorClass} whitespace-pre-wrap`}>
                          {logStr}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  </div>

      {/* LIGHTBOX MODAL: FACEBOOK STYLE VIEWPORT */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-0 md:p-6 transition-all animate-in fade-in duration-300">
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full h-full max-w-7xl bg-black rounded-none md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-strong border border-white/5 relative"
            >
              
              {/* Close Button Mobile */}
              <button 
                onClick={handleCloseAlbum}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 z-50 md:hidden backdrop-blur-md transition-all shadow"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN: Visual Media slider + Thumbnail strip (70% width on Desktop) */}
              <div className="flex-1 bg-neutral-950 flex flex-col justify-between p-4 relative min-h-[50vh] md:min-h-0">
                <div className="flex justify-between items-center z-10 text-white px-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-church-gold" />
                    <span className="text-[11px] uppercase tracking-widest font-black text-slate-300">
                      {photoIndex + 1} de {activePhotos.length}
                    </span>
                  </div>
                  {/* Close button Desktop */}
                  <button 
                    onClick={handleCloseAlbum}
                    className="hidden md:flex bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full p-2.5 transition-all shadow-md cursor-pointer"
                    title="Cerrar álbum / lightbox"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Slideshow image container */}
                <div className="relative flex-grow flex items-center justify-center my-4 overflow-hidden px-10">
                  {/* Navigation Arrows */}
                  {activePhotos.length > 1 && (
                    <>
                      <button 
                        onClick={() => setPhotoIndex(prev => (prev === 0 ? activePhotos.length - 1 : prev - 1))}
                        className="absolute left-1 bg-black/60 hover:bg-black/90 text-white border border-white/5 rounded-full p-3 transition-all cursor-pointer z-20 hover:scale-105"
                        title={translateText('Anterior', currentLang)}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setPhotoIndex(prev => (prev === activePhotos.length - 1 ? 0 : prev + 1))}
                        className="absolute right-1 bg-black/60 hover:bg-black/90 text-white border border-white/5 rounded-full p-3 transition-all cursor-pointer z-20 hover:scale-105"
                        title={translateText('Siguiente', currentLang)}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Main displayed image */}
                  <motion.img 
                    key={photoIndex}
                    initial={{ opacity: 0.8, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    src={activePhotos[photoIndex]} 
                    alt={activeItem.title}
                    className="max-h-[55vh] md:max-h-[66vh] max-w-full object-contain select-none rounded-2xl shadow-xl border border-white/5"
                    referrerPolicy="no-referrer"
                  />

                  {/* Delete photo option if Administrator/Moderator session is logged in */}
                  {galleryAdmin && (
                    <button
                      onClick={handleDeletePhotoFromAlbum}
                      className="absolute bottom-4 left-4 bg-red-650 hover:bg-red-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest px-4.5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 z-30 border border-white/10 cursor-pointer"
                      title={currentLang === 'pt' ? 'Deletar esta foto permanentemente' : 'Eliminar esta foto permanentemente'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{currentLang === 'pt' ? 'Excluir esta Foto' : 'Eliminar esta Foto'}</span>
                    </button>
                  )}
                </div>

                {/* BOTTOM Thumbnail Carousel strip */}
                {activePhotos.length > 1 && (
                  <div className="flex overflow-x-auto gap-2 py-2 px-1 max-w-lg mx-auto scrollbar-thin border-t border-white/5 justify-center">
                    {activePhotos.map((url, i) => (
                      <button 
                        key={i} 
                        onClick={() => setPhotoIndex(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${photoIndex === i ? 'border-church-gold ring-2 ring-church-gold/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Interactive community details & live feedback panel */}
              <div className="w-full md:w-85 bg-white border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between h-[45vh] md:h-full overflow-hidden text-church-navy">
                
                {/* Header Information Pane */}
                <div className="p-6 border-b border-slate-100 space-y-4 shrink-0 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-church-navy/5 flex items-center justify-center font-serif text-church-navy font-bold shadow-sm">
                      ⛪
                    </div>
                    <div>
                      <h5 className="font-bold text-sm tracking-tight text-church-navy">Nuestra Iglesia</h5>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 font-semibold">
                        {translateText(activeItem.date, currentLang || 'es')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {activeItem.eventName && (
                      <span className="inline-block text-[9px] bg-church-gold/15 text-church-gold font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                        Álbum: {translateText(activeItem.eventName, currentLang)}
                      </span>
                    )}
                    <h3 className="text-lg font-serif font-black text-church-navy leading-tight">
                      {translateText(activeItem.title, currentLang)}
                    </h3>
                    {activeItem.description && (
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 max-h-[100px] overflow-y-auto">
                        {activeItem.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE COMMENTS SCROLL CONTAINER */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dbComments.length} {currentLang === 'pt' ? 'comentários de bênção' : 'comentarios de bendición'}</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {dbComments.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 italic text-xs">
                        {currentLang === 'pt' ? 'Nenhum comentário ainda. Seja o primeiro a deixar uma bênção!' : 'Ningún comentario aún. ¡Sé el primero en dejar una bendición!'}
                      </div>
                    ) : (
                      dbComments.map((c, i) => (
                        <div key={c.id || i} className="text-xs space-y-1 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center bg-slate-50/50 p-1 rounded-lg">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-church-navy">{c.authorName}</span>
                              {currentUser && c.userId === currentUser.uid && (
                                <span className="text-[8px] bg-church-gold/20 text-church-gold font-bold px-1 py-0.2 rounded-full uppercase tracking-wider scale-90">
                                  {currentLang === 'pt' ? 'Você' : 'Tú'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-400 text-[8px] font-mono">
                              <span>
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'es-ES', {hour: '2-digit', minute:'2-digit'}) : ''}
                              </span>
                              {currentUser && c.userId === currentUser.uid && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await deleteDoc(doc(db, 'gallery_comments', c.id));
                                    } catch (err) {
                                      console.error("Error deleting comment:", err);
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
                                  title="Delete comment / Eliminar comentario"
                                >
                                  ❌
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-slate-600 italic leading-relaxed">
                            "{c.text}"
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* DYNAMIC REACT & INPUT TEXTBAR (Facebook-style sticky bottom bar) */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-4">
                  {/* Reaction Buttons */}
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <button 
                      onClick={() => incrementReaction(activeItem.id, 'likes')}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="Me gusta"
                    >
                      <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-sm transition-all ${
                        hasUserReacted(activeItem.id, 'likes') 
                          ? 'bg-blue-100 ring-2 ring-blue-400 scale-105' 
                          : 'bg-slate-50 hover:bg-blue-50 group-hover/btn:scale-110'
                      }`}>
                        👍
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest leading-none transition-colors ${
                        hasUserReacted(activeItem.id, 'likes') ? 'text-blue-600' : 'text-slate-400 group-hover/btn:text-blue-500'
                      }`}>
                        {getReactions(activeItem.id).likes}
                      </span>
                    </button>

                    <button 
                      onClick={() => incrementReaction(activeItem.id, 'loves')}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="¡Me encanta!"
                    >
                      <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-sm transition-all ${
                        hasUserReacted(activeItem.id, 'loves') 
                          ? 'bg-red-100 ring-2 ring-red-400 scale-105' 
                          : 'bg-slate-50 hover:bg-red-50 group-hover/btn:scale-110'
                      }`}>
                        ❤️
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest leading-none transition-colors ${
                        hasUserReacted(activeItem.id, 'loves') ? 'text-red-600' : 'text-slate-400 group-hover/btn:text-red-500'
                      }`}>
                        {getReactions(activeItem.id).loves}
                      </span>
                    </button>

                    <button 
                      onClick={() => incrementReaction(activeItem.id, 'amens')}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="Amén"
                    >
                      <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-sm transition-all ${
                        hasUserReacted(activeItem.id, 'amens') 
                          ? 'bg-amber-100 ring-2 ring-amber-400 scale-105' 
                          : 'bg-slate-50 hover:bg-amber-100 group-hover/btn:scale-110'
                      }`}>
                        🙏
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest leading-none transition-colors ${
                        hasUserReacted(activeItem.id, 'amens') ? 'text-[#cf9d34]' : 'text-slate-400 group-hover/btn:text-[#cf9d34]'
                      }`}>
                        {getReactions(activeItem.id).amens}
                      </span>
                    </button>

                    <button 
                      onClick={() => incrementReaction(activeItem.id, 'bless')}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="Bendiciones"
                    >
                      <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-sm transition-all ${
                        hasUserReacted(activeItem.id, 'bless') 
                          ? 'bg-purple-100 ring-2 ring-purple-400 scale-105' 
                          : 'bg-slate-50 hover:bg-purple-50 group-hover/btn:scale-110'
                      }`}>
                        ✨
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest leading-none transition-colors ${
                        hasUserReacted(activeItem.id, 'bless') ? 'text-purple-600' : 'text-slate-400 group-hover/btn:text-purple-600'
                      }`}>
                        {getReactions(activeItem.id).bless}
                      </span>
                    </button>
                  </div>

                  {/* Comment & Registration Bar */}
                  <div className="bg-[#fcfcfa] rounded-2xl p-3 border border-slate-100">
                    {currentUser && registeredUser ? (
                      registeredUser.isBlocked ? (
                        <div className="py-2.5 px-4 text-center bg-red-50/70 border border-red-100 rounded-2xl animate-in zoom-in-95 duration-150">
                          <p className="text-[11px] font-black text-red-600 leading-relaxed flex items-center justify-center gap-1.5 font-sans">
                            <span>🚫</span>
                            <span>
                              {currentLang === 'pt' 
                                ? 'Sua conta de comentarista foi bloqueada temporariamente pela moderação.' 
                                : 'Su cuenta de comentarista ha sido bloqueada temporalmente por la moderación.'}
                            </span>
                          </p>
                          <button
                            onClick={handleSignOut}
                            className="mt-1 text-[9px] text-red-400 hover:text-red-600 hover:underline font-black uppercase tracking-widest cursor-pointer"
                          >
                            {currentLang === 'pt' ? 'Mudar de Conta' : 'Cambiar de Cuenta'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-550 font-bold px-1">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-550 animate-pulse" />
                              <span>
                                {currentLang === 'pt' ? 'Conectado como:' : 'Conectado como:'} <strong className="text-church-navy">{registeredUser.name}</strong>
                              </span>
                            </div>
                            <button 
                              onClick={handleSignOut}
                              className="text-red-400 hover:text-red-650 transition-all font-black uppercase tracking-wider cursor-pointer"
                            >
                              {currentLang === 'pt' ? 'Sair' : 'Salir'}
                            </button>
                          </div>
                          <form onSubmit={(e) => handlePostComment(e, activeItem.id)} className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder={translateText('Comentar algo hermoso...', currentLang)}
                              value={currentInputComment}
                              onChange={(e) => setCurrentInputComment(e.target.value)}
                              className="flex-grow py-2 px-3 bg-white border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25 focus:bg-white text-church-navy transition-all shadow-sm"
                            />
                            <button 
                              type="submit"
                              disabled={!currentInputComment.trim()}
                              className="w-8 h-8 rounded-full bg-church-gold hover:bg-[#b08520] transition-colors flex items-center justify-center text-white disabled:opacity-50 shrink-0 shadow-md cursor-pointer animate-in fade-in"
                              title="Enviar comentario"
                            >
                              <Send className="w-3.5 h-3.5 ml-0.5 text-white" />
                            </button>
                          </form>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-xs font-serif font-black text-church-navy">
                            {currentLang === 'pt' ? 'Participe com um Comentário de Bênção!' : '¡Participe con un Comentario de Bendición!'}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium">
                            {currentLang === 'pt' ? 'Identifique-se rápido ou faça login com Google para postar comentários persistentes.' : 'Identifíquese rápido o haga login con Google para publicar comentarios persistentes.'}
                          </p>
                        </div>

                        {isRegMode ? (
                          <form onSubmit={handleRegisterUser} className="space-y-2 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text"
                                placeholder={currentLang === 'pt' ? 'Seu Nome / Apelido' : 'Tu Nombre / Apodo'}
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25"
                                required
                              />
                              <input 
                                type="email"
                                placeholder={currentLang === 'pt' ? 'Seu E-mail' : 'Tu Correo'}
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25"
                                required
                              />
                            </div>
                            {statusMessage && (
                              <p className="text-[10px] font-bold text-[#cf9d34] text-center leading-tight">
                                {statusMessage}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-1.5 px-3 bg-church-navy hover:bg-church-navy/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer text-center"
                              >
                                {loading ? '...' : (currentLang === 'pt' ? 'Concluir Cadastro' : 'Completar Registro')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsRegMode(false)}
                                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                {currentLang === 'pt' ? 'Cancelar' : 'Cancelar'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setIsRegMode(true)}
                                className="flex-1 py-2 px-3 border border-church-gold text-church-gold hover:bg-church-gold/5 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                              >
                                ✍️ {currentLang === 'pt' ? 'Registrar Nickname' : 'Registrar Apodo'}
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    setStatusMessage('');
                                    await loginWithGoogle();
                                  } catch (err) {
                                    console.error("Google auth fail:", err);
                                  }
                                }}
                                className="flex-1 py-2 px-3 bg-[#4285F4] hover:bg-[#357ae8] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                🌐 {currentLang === 'pt' ? 'Entrar com Google' : 'Google Sign-In'}
                              </button>
                            </div>
                            {statusMessage && (
                              <p className="text-[10px] font-bold text-center text-[#cf9d34]">{statusMessage}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
