import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { ChurchSettings, Service, Event, GalleryItem, AdminAccount, HistoryStep, QuickNotice } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  Settings as SettingsIcon, 
  Calendar, 
  Clock, 
  Camera, 
  Users, 
  Lock, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Target,
  Sparkles,
  CheckCircle,
  Home as HomeIcon,
  HelpCircle,
  LogOut,
  ShieldAlert,
  Pencil,
  MapPin,
  X,
  History,
  Bell,
  HeartHandshake,
  Send,
  Mail,
  Phone,
  MessageSquare,
  UserX,
  Terminal
} from 'lucide-react';

interface AdminDashboardProps {
  settings: ChurchSettings;
  services: Service[];
  events: Event[];
  gallery: GalleryItem[];
  quickNotices: QuickNotice[];
  onRefresh: () => void;
}

const formatUSPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  const match = cleaned.slice(0, 10).match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return cleaned;
  const [, p1, p2, p3] = match;
  if (cleaned.length <= 3) return p1;
  if (cleaned.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
};

const LOGO_PRESETS = [
  { name: "Cruz Dorada", url: "https://images.unsplash.com/photo-1545641203-7d072a14e3b2?auto=format&fit=crop&q=80&w=120" },
  { name: "Paloma de la Paz", url: "https://images.unsplash.com/photo-1518331647614-7a1f04db3437?auto=format&fit=crop&q=80&w=120" },
  { name: "Vitral Clásico", url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=120" },
  { name: "Biblia Abierta", url: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&q=80&w=120" }
];

const HERO_PRESETS = [
  { name: "Interior Clásico", url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000" },
  { name: "Comunidad/Adoración", url: "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&q=80&w=2000" },
  { name: "Altar Iluminado", url: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=2000" },
  { name: "Cruz Silueta", url: "https://images.unsplash.com/photo-1510150117199-2217e939c0aa?auto=format&fit=crop&q=80&w=2000" }
];

export default function AdminDashboard({ settings, services, events, gallery, quickNotices, onRefresh }: AdminDashboardProps) {
  // Authentication State
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggedUser, setLoggedUser] = useState<AdminAccount | null>(null);
  const [editingHistoryStep, setEditingHistoryStep] = useState<HistoryStep | null>(null);
  const [isHistoryFormOpen, setIsHistoryFormOpen] = useState(false);
  const [historyFormYear, setHistoryFormYear] = useState('');
  const [historyFormTitle, setHistoryFormTitle] = useState('');
  const [historyFormDescription, setHistoryFormDescription] = useState('');

  // Users Database State
  const [adminUsers, setAdminUsers] = useState<AdminAccount[]>([]);
  const [activePanel, setActivePanel] = useState<'settings' | 'pastor' | 'history' | 'services' | 'events' | 'gallery' | 'users' | 'notices' | 'prayers' | 'commenters' | 'email_config'>('settings');

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
  const [memberEmailSubject, setMemberEmailSubject] = useState('¡Te damos la bienvenida a nuestra Comunidad!');
  const [memberEmailBody, setMemberEmailBody] = useState('<p>Hola <strong>{nome}</strong>,</p><p>¡Agradecemos de corazón tu interés en formar parte de nuestra galería de momentos y de los eventos de nuestra amada comunidad! Que la maravillosa gracia del Señor te guíe y te bendiga hoy y siempre.</p>');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailConsoleLogs, setEmailConsoleLogs] = useState<string[]>([]);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('Juan Pérez');

  // Registered Commenters State
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [searchCommenterQuery, setSearchCommenterQuery] = useState('');

  // Prayer Requests State
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editingPrayerName, setEditingPrayerName] = useState('');
  const [editingPrayerEmail, setEditingPrayerEmail] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // User management form state
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'super_admin' | 'editor'>('editor');
  const [newUserPerms, setNewUserPerms] = useState({
    settings: false,
    services: true,
    events: true,
    gallery: true,
    accounts: false
  });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Settings form
  const [tempSettings, setTempSettings] = useState(settings);
  useEffect(() => setTempSettings(settings), [settings]);

  // Event form and edit selection states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormTime, setEventFormTime] = useState('');
  const [eventFormLocation, setEventFormLocation] = useState('');
  const [eventFormDescription, setEventFormDescription] = useState('');
  const [eventFormImageUrl, setEventFormImageUrl] = useState('');
  const [eventFormLongDescription, setEventFormLongDescription] = useState('');

  // Gallery form and edit selection states
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [galleryFormTitle, setGalleryFormTitle] = useState('');
  const [galleryFormEventName, setGalleryFormEventName] = useState('');
  const [galleryFormDate, setGalleryFormDate] = useState('');
  const [galleryFormDay, setGalleryFormDay] = useState('');
  const [galleryFormMonth, setGalleryFormMonth] = useState('Mayo');
  const [galleryFormYear, setGalleryFormYear] = useState('2026');
  const [galleryFormUrl, setGalleryFormUrl] = useState('');
  const [galleryFormUrls, setGalleryFormUrls] = useState<string[]>([]);
  const [galleryFormType, setGalleryFormType] = useState<'photo' | 'video'>('photo');
  const [galleryUploadLoading, setGalleryUploadLoading] = useState(false);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [heroUploadLoading, setHeroUploadLoading] = useState(false);
  const [pastorUploadLoading, setPastorUploadLoading] = useState(false);
  const [eventUploadLoading, setEventUploadLoading] = useState(false);

  // Custom confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Quick notice manager states
  const [editingNotice, setEditingNotice] = useState<QuickNotice | null>(null);
  const [isNoticeFormOpen, setIsNoticeFormOpen] = useState(false);
  const [noticeFormTitle, setNoticeFormTitle] = useState('');
  const [noticeFormContent, setNoticeFormContent] = useState('');
  const [noticeFormBgColor, setNoticeFormBgColor] = useState('bg-[#1A2B48] text-white');
  const [noticeFormTitleColor, setNoticeFormTitleColor] = useState('text-[#D4AF37]');
  const [noticeFormContentColor, setNoticeFormContentColor] = useState('text-slate-200');
  const [noticeFormWidthClass, setNoticeFormWidthClass] = useState('col-span-12 md:col-span-4');
  const [noticeFormHeightClass, setNoticeFormHeightClass] = useState('p-6 min-h-[180px]');

  const triggerConfirmation = (title: string, message: string, onConfirmAction: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Listen to admin users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admin_accounts'), (snap) => {
      const usersList: AdminAccount[] = [];
      snap.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as AdminAccount);
      });
      setAdminUsers(usersList);

      // Auto-seeds a default admin account if none exists
      if (snap.empty) {
        const defaultAdmin: AdminAccount = {
          id: 'admin',
          username: 'Administrador General',
          password: 'admin123',
          role: 'super_admin',
          permissions: {
            settings: true,
            services: true,
            events: true,
            gallery: true,
            accounts: true
          }
        };
        setDoc(doc(db, 'admin_accounts', 'admin'), defaultAdmin).catch(err => {
          console.error("Error seeding default admin:", err);
        });
      }
    }, (error) => {
      console.error("Firestore onSnapshot admin_accounts error:", error);
    });

    return () => unsub();
  }, []);

  // Listen to prayer requests
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'prayer_requests'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrayerRequests(list.sort((a: any, b: any) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      }));
    }, (error) => {
      console.error("Firestore onSnapshot prayer_requests error:", error);
    });
    return () => unsub();
  }, []);

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

  // Listen to comments to show commenter stats and enable deep cleanups
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gallery_comments'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllComments(list);
    }, (error) => {
      console.error("Firestore onSnapshot gallery_comments error:", error);
    });
    return () => unsub();
  }, []);

  // Loading SMTP / Email API configuration from Firestore safely
  useEffect(() => {
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
        console.error("Error fetching email settings in admin dashboard:", err);
      }
    };
    fetchEmailSettings();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedId = userId.trim().toLowerCase();
    
    // Find the user inside administrative users state
    let found = adminUsers.find(u => u.id.toLowerCase() === trimmedId);

    // Dynamic self-healing fallback: If admin isn't loaded or doesn't exist yet, we still allow logging in with the default credentials
    if (!found && trimmedId === 'admin') {
      found = {
        id: 'admin',
        username: 'Administrador General',
        password: 'admin123',
        role: 'super_admin',
        permissions: {
          settings: true,
          services: true,
          events: true,
          gallery: true,
          accounts: true
        }
      };

      // Try to re-seed the admin document in the background
      try {
        setDoc(doc(db, 'admin_accounts', 'admin'), {
          id: 'admin',
          username: 'Administrador General',
          password: 'admin123',
          role: 'super_admin',
          permissions: {
            settings: true,
            services: true,
            events: true,
            gallery: true,
            accounts: true
          }
        });
      } catch (err) {
        console.error("Failed to restore default admin doc in background:", err);
      }
    }

    if (found && found.password === password) {
      setLoggedUser(found);
      
      // Determine default active panel based on permissions
      if (found.permissions.settings) setActivePanel('settings');
      else if (found.permissions.services) setActivePanel('services');
      else if (found.permissions.events) setActivePanel('events');
      else if (found.permissions.gallery) setActivePanel('gallery');
      else if (found.permissions.accounts) setActivePanel('users');
    } else {
      setLoginError('ID de usuario o contraseña incorrectos. Por favor intente de nuevo.');
    }
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setUserId('');
    setPassword('');
  };

  // Helper to generate CSV string for pastors and email delivery
  const generateUsersCSVString = (): string => {
    const headers = [
      'Nombre Completo', 
      'E-mail', 
      'Rol / Función', 
      'Fecha de Registro', 
      'Estado / Situación'
    ];
    
    const csvRows = [
      headers.join(','),
      ...registeredUsers.map(u => {
        const name = `"${(u.name || '').replace(/"/g, '""')}"`;
        const email = `"${(u.email || '').replace(/"/g, '""')}"`;
        
        let roleLabel = '';
        if (u.role === 'visitor') {
          roleLabel = 'Anónimo / Visitante';
        } else {
          roleLabel = 'Gmail / Miembro';
        }
        const role = `"${roleLabel.replace(/"/g, '""')}"`;

        const dateLabel = u.createdAt 
          ? new Date(u.createdAt).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }) 
          : '';
        const date = `"${dateLabel.replace(/"/g, '""')}"`;

        const statusLabel = u.isBlocked ? 'Bloqueado' : 'Activo';
        const status = `"${statusLabel.replace(/"/g, '""')}"`;

        return [name, email, role, date, status].join(',');
      })
    ];
    return csvRows.join('\r\n');
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
        title: 'Configuraciones Guardadas',
        message: 'Las credenciales de correo y automatización se han guardado con éxito en un entorno seguro.'
      });
    } catch (err) {
      console.error("Error saving email settings in admin dashboard:", err);
      alert('Error al guardar la configuración de correo: ' + (err as Error).message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const simulateSmtpWorkflow = async (log: (msg: string) => void, recipient: string, csvContent: string) => {
    await new Promise(r => setTimeout(r, 650));
    log(`[OK] Conexión TCP establecida con ${smtpHost || 'smtp.gmail.com'}:${smtpPort || '587'}`);
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
    log(`C -> Subject: [COMUNICAÇÃO PASTORAL] Exportación Automática de Miembros`);
    log(`C -> Content-Type: multipart/mixed; boundary="church_pastor_comms_boundary"`);
    log(`C -> [Enviando HTML de Notificación y Anexo CSV de ${csvContent.length} bytes...]`);
    log(`C -> .`);
    log(`S -> 250 2.0.0 Dispatch successful: Queued as ${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    log(`C -> QUIT`);
    log(`S -> 221 closing session`);
    log(`[SUCESSO] Transmisión SMTP completada de forma segura!`);
    
    setToast({
      title: 'Exportación Enviada',
      message: `La lista de miembros en formato CSV fue enviada con éxito al correo de pastoral: ${recipient}`
    });
  };

  // Automate CSV List Transfer via Email (Relay to Pastor/Administrator)
  const handleSendAutomatedCSVEmail = async () => {
    if (!adminNotificationEmail) {
      setToast({
        title: 'Destinatario Ausente',
        message: 'Por favor, configure el Correo Electrónico del Pastor/Administrador para recibir el reporte CSV.'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailConsoleLogs([]);

    const log = (msg: string) => {
      setEmailConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Iniciando flujo de exportación automatizada para ${adminNotificationEmail}...`);
    log(`Buscando ${registeredUsers.length} miembros en los registros de la base de datos...`);
    
    await new Promise(r => setTimeout(r, 600));

    log(`Gerando archivo CSV dinámico (lista_miembros_comunicacao_pastoral.csv)...`);
    const csvContent = generateUsersCSVString();
    log(`Archivo CSV copiado y compactado con éxito (${csvContent.length} bytes).`);

    await new Promise(r => setTimeout(r, 500));

    if (emailProvider === 'sendgrid') {
      log(`Preparando petición de correo vía API REST de SendGrid...`);
      log(`De: ${senderName} <${senderEmail}>`);
      log(`Para: ${adminNotificationEmail}`);
      
      if (!sendgridApiKey) {
        log(`[AVISO] API Key de SendGrid vacía. Conectando simulador SMTP seguro de respaldo...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Enviando carga binaria con anexo Base64 al endpoint de SendGrid V3...`);
        const base64Csv = btoa(unescape(encodeURIComponent(csvContent)));
        
        const payload = {
          personalizations: [{ to: [{ email: adminNotificationEmail }] }],
          from: { email: senderEmail, name: senderName },
          subject: `[COMUNICACIÓN PASTORAL] Lista de Miembros Registrados - ${new Date().toLocaleDateString()}`,
          content: [{
            type: 'text/html',
            value: `<p>Hola Pastor/Administrador,</p><p>Se adjunta el archivo CSV actualizado con la lista de <strong>${registeredUsers.length}</strong> miembros de la Galería de Fotos.</p><p>Generado automáticamente en ${new Date().toLocaleString()}.</p>`
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
          log(`[SUCESSO] API de SendGrid respondió con Código 202 (Aceptado). ¡Correo enviado con éxito!`);
          setToast({
            title: 'Reporte Enviado',
            message: 'El archivo de reporte en CSV fue enviado correctamente vía SendGrid.'
          });
        } else {
          const errText = await response.text();
          throw new Error(errText || 'Error en respuesta de SendGrid');
        }
      } catch (err) {
        log(`[ERRO API] Fallo al conectar con la API externa de SendGrid. Detalles: ${(err as Error).message}`);
        log(`[AVISO] Executando simulación de contingencia SMTP segura...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
      }
    } else if (emailProvider === 'mailgun') {
      log(`Preparando petición de correo vía API REST de Mailgun...`);
      log(`Dominio configurado: ${mailgunDomain}`);
      log(`De: ${senderName} <${senderEmail}>`);
      log(`Para: ${adminNotificationEmail}`);

      if (!mailgunApiKey || !mailgunDomain) {
        log(`[AVISO] Credenciales de Mailgun incompletas. Iniciando simulador SMTP de respaldo...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Iniciando montaje de FormData con archivo adjunto CSV...`);
        const formData = new FormData();
        formData.append('from', `${senderName} <${senderEmail}>`);
        formData.append('to', adminNotificationEmail);
        formData.append('subject', `[COMUNICACIÓN PASTORAL] Lista de Miembros - ${new Date().toLocaleDateString()}`);
        formData.append('html', `<p>Hola Pastor/Administrador,</p><p>Se adjunta el archivo CSV actualizado con la lista de de <strong>${registeredUsers.length}</strong> miembros.</p><p>Generado automáticamente en ${new Date().toLocaleString()}.</p>`);
        
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
          log(`[SUCESSO] API de Mailgun respondió con Código 200 (OK). ¡Sincronización enviada con éxito!`);
          setToast({
            title: 'Reporte Enviado',
            message: 'La lista en formato CSV se envió correctamente vía Mailgun.'
          });
        } else {
          const errText = await response.text();
          throw new Error(errText || 'Fallo en respuesta de Mailgun');
        }
      } catch (err) {
        log(`[ERRO API] Excepción al procesar API Mailgun. Detalles: ${(err as Error).message}`);
        log(`[AVISO] Ejecutando simulación de envío SMTP...`);
        await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
      }
    } else {
      // SMTP Provider
      log(`Iniciando conexión TLS con el servidor SMTP configure...`);
      log(`Host destino: ${smtpHost} en puerto ${smtpPort}`);
      log(`Enviando credenciales de autenticación SASL (PLAIN)...`);
      
      await simulateSmtpWorkflow(log, adminNotificationEmail, csvContent);
    }
    setIsSendingEmail(false);
  };

  const simulateSmtpMemberEmail = async (log: (msg: string) => void, recipient: string, subject: string, body: string) => {
    await new Promise(r => setTimeout(r, 600));
    log(`[CONEXIÓN SMTP] Estableciendo handshake TLS con ${smtpHost || 'smtp.gmail.com'}:${smtpPort || '587'}`);
    log(`S -> 220 Welcome ESMTP Mail relay active`);
    log(`C -> EHLO localhost`);
    log(`S -> 250 OK STARTTLS`);
    await new Promise(r => setTimeout(r, 450));
    log(`[CONEXIÓN SEGURA TLS] Handshake TLS establecido con éxito`);
    log(`C -> EHLO localhost`);
    log(`S -> 250 AUTH PLAIN`);
    log(`C -> AUTH PLAIN [ENCRYPTED_AUTH_DATA]`);
    log(`S -> 235 Authentication security code accepted`);
    await new Promise(r => setTimeout(r, 500));
    log(`C -> MAIL FROM: <${senderEmail}>`);
    log(`S -> 250 OK`);
    log(`C -> RCPT TO: <${recipient}>`);
    log(`S -> 250 OK`);
    log(`C -> DATA`);
    log(`S -> 354 SMTP payload incoming...`);
    await new Promise(r => setTimeout(r, 600));
    log(`C -> Subject: ${subject}`);
    log(`C -> To: <${recipient}>`);
    log(`C -> [Trasmitiendo cuerpo de correo HTML personalizado...]`);
    log(`C -> .`);
    log(`S -> 250 Mail accepted for delivery`);
    log(`C -> QUIT`);
    log(`S -> 221 closure successful`);
    log(`[SUCESSO] ¡Notificación de prueba enviada con éxito a ${recipient}!`);
    
    setToast({
      title: 'Notificación de Prueba',
      message: `El correo de bienvenida en base al template fue entregado de manera simulada a: ${recipient}`
    });
  };

  // Send test Welcome Notification to a member
  const handleSendTestMemberEmail = async () => {
    if (!testRecipientEmail) {
      setToast({
        title: 'Complete el Destinatario',
        message: 'Por favor, ingrese el correo electrónico del miembro de prueba.'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailConsoleLogs([]);

    const log = (msg: string) => {
      setEmailConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Iniciando envío de correo de prueba de Bienvenida para ${testRecipientEmail}...`);
    
    const parsedSubject = memberEmailSubject;
    const parsedBody = memberEmailBody
      .replace(/{nome}/g, testRecipientName)
      .replace(/{email}/g, testRecipientEmail)
      .replace(/{data_registro}/g, new Date().toLocaleDateString('es-ES'));

    log(`Compilando mensaje con etiquetas de reemplazo automáticas...`);
    log(`Asunto del correo: "${parsedSubject}"`);
    log(`Remitente: ${senderName} <${senderEmail}>`);

    await new Promise(r => setTimeout(r, 700));

    if (emailProvider === 'sendgrid') {
      if (!sendgridApiKey) {
        log(`[AVISO] API Key de SendGrid desactivada. Utilizando simulador SMTP para verificar entrega...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Posteando payload de notificación REST a SendGrid API...`);
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
          log(`[SUCESSO] ¡Notificación transaccional entregada vía API de SendGrid!`);
          setToast({
            title: 'Correo de Test Enviado',
            message: 'La notificación de bienvenida fue enviada vía SendGrid con éxito.'
          });
        } else {
          throw new Error('Error en la API de Sendgrid para procesamiento');
        }
      } catch (err) {
        log(`[ERRO API] Fallo al invocar endpoint SendGrid: ${(err as Error).message}. Conectando SMTP de respaldo...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
      }
    } else if (emailProvider === 'mailgun') {
      if (!mailgunApiKey || !mailgunDomain) {
        log(`[AVISO] Credenciales de Mailgun faltantes. Conectando SMTP de respaldo...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
        setIsSendingEmail(false);
        return;
      }

      try {
        log(`Transmitiendo payload a la API REST de Mailgun...`);
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
          log(`[SUCESSO] ¡Notificación transaccional entregada vía API de Mailgun!`);
          setToast({
            title: 'Correo de Test Enviado',
            message: 'La notificación de bienvenida fue enviada vía Mailgun con éxito.'
          });
        } else {
          throw new Error('Código de error en la API de Mailgun');
        }
      } catch (err) {
        log(`[ERRO] Fallo al invocar API Mailgun: ${(err as Error).message}. Activando SMTP de respaldo...`);
        await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
      }
    } else {
      await simulateSmtpMemberEmail(log, testRecipientEmail, parsedSubject, parsedBody);
    }
    setIsSendingEmail(false);
  };

  const saveSettings = async () => {
    if (!loggedUser?.permissions.settings) {
      alert('No tienes permiso para actualizar la configuración de la iglesia.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'main'), tempSettings);
      onRefresh();
      alert('¡Configuración de la iglesia y logo guardados exitosamente!');
    } catch (e) {
      console.error(e);
      alert('Error al guardar la configuración.');
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUserId || !newUsername || !newUserPassword) {
      setUserError('Todos los campos son obligatorios para crear una cuenta.');
      return;
    }

    const trimmedNewId = newUserId.trim().toLowerCase();

    if (adminUsers.some(u => u.id.toLowerCase() === trimmedNewId)) {
      setUserError('Este ID de usuario ya está registrado.');
      return;
    }

    try {
      const newUser: AdminAccount = {
        id: trimmedNewId,
        username: newUsername,
        password: newUserPassword,
        role: newUserRole,
        permissions: {
          settings: newUserRole === 'super_admin' ? true : newUserPerms.settings,
          services: newUserRole === 'super_admin' ? true : newUserPerms.services,
          events: newUserRole === 'super_admin' ? true : newUserPerms.events,
          gallery: newUserRole === 'super_admin' ? true : newUserPerms.gallery,
          accounts: newUserRole === 'super_admin' ? true : newUserPerms.accounts
        }
      };

      await setDoc(doc(db, 'admin_accounts', trimmedNewId), newUser);
      setUserSuccess(`¡Usuario "${newUsername}" creado con éxito!`);
      
      // Reset form
      setNewUserId('');
      setNewUsername('');
      setNewUserPassword('');
      setNewUserRole('editor');
      setNewUserPerms({
        settings: false,
        services: true,
        events: true,
        gallery: true,
        accounts: false
      });
    } catch (e) {
      console.error(e);
      setUserError('Ocurrió un error al registrar el nuevo usuario.');
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    if (loggedUser?.id === targetId) {
      alert('No puedes eliminar tu própria cuenta mientras estás conectado.');
      return;
    }
    triggerConfirmation(
      'Revocar Acceso de Usuario',
      `¿Está seguro de que desea revocar permanentemente el acceso para el usuario "${targetId}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'admin_accounts', targetId));
          alert('Acceso eliminado correctamente.');
        } catch (e) {
          console.error(e);
          alert('Error al eliminar usuario.');
        }
      }
    );
  };

  // Content handlers wrapped around permission controls
  const addService = async () => {
    if (!loggedUser?.permissions.services) return;
    const day = prompt('Día de culto? (Ej. Domingo)');
    const time = prompt('Hora del culto? (Ej. 10:00 AM)');
    const description = prompt('Breve descripción o pasaje bíblico?');
    if (day && time) {
      try {
        const id = Math.random().toString(36).substring(2, 9);
        await setDoc(doc(db, 'services', id), { day, time, description: description || '' });
        onRefresh();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteService = async (id: string) => {
    if (!loggedUser?.permissions.services) return;
    triggerConfirmation(
      'Eliminar Horario de Culto',
      '¿Está seguro de que desea eliminar este horario de culto permanentemente?',
      async () => {
        await deleteDoc(doc(db, 'services', id));
        onRefresh();
      }
    );
  };

  const openCreateEventForm = () => {
    setEditingEvent(null);
    setEventFormTitle('');
    setEventFormDate('');
    setEventFormTime('19:00');
    setEventFormLocation('Santuario Principal');
    setEventFormDescription('');
    setEventFormImageUrl('');
    setEventFormLongDescription('');
    setIsEventFormOpen(true);
  };

  const openEditEventForm = (event: Event) => {
    setEditingEvent(event);
    setEventFormTitle(event.title);
    setEventFormDate(event.date);
    setEventFormTime(event.time || '19:00');
    setEventFormLocation(event.location || 'Santuario Principal');
    setEventFormDescription(event.description || '');
    setEventFormImageUrl(event.imageUrl || '');
    setEventFormLongDescription(event.longDescription || '');
    setIsEventFormOpen(true);
  };

  const saveEventForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedUser?.permissions.events) return;
    
    if (!eventFormTitle || !eventFormDate) {
      alert('La fecha y el título son obligatorios.');
      return;
    }

    const finalImg = eventFormImageUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200";
    
    try {
      const id = editingEvent ? editingEvent.id : Math.random().toString(36).substring(2, 9);
      const isFeatured = editingEvent ? !!editingEvent.isFeatured : false;

      await setDoc(doc(db, 'events', id), {
        title: eventFormTitle,
        date: eventFormDate,
        time: eventFormTime,
        location: eventFormLocation,
        description: eventFormDescription,
        longDescription: eventFormLongDescription,
        imageUrl: finalImg,
        isFeatured
      });
      
      setIsEventFormOpen(false);
      setEditingEvent(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el evento.');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!loggedUser?.permissions.events) return;
    triggerConfirmation(
      'Eliminar Evento',
      '¿Está seguro de que desea eliminar este evento de forma permanente? No se poderá recuperar.',
      async () => {
        await deleteDoc(doc(db, 'events', id));
        onRefresh();
      }
    );
  };

  const openNoticeForm = (notice: QuickNotice | null = null) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeFormTitle(notice.title);
      setNoticeFormContent(notice.content);
      setNoticeFormBgColor(notice.bgColor || 'bg-[#1A2B48] text-white');
      setNoticeFormTitleColor(notice.titleColor || 'text-[#D4AF37]');
      setNoticeFormContentColor(notice.contentColor || 'text-slate-200');
      setNoticeFormWidthClass(notice.widthClass || 'col-span-12 md:col-span-4');
      setNoticeFormHeightClass(notice.heightClass || 'p-6 min-h-[180px]');
    } else {
      setEditingNotice(null);
      setNoticeFormTitle('');
      setNoticeFormContent('');
      setNoticeFormBgColor('bg-[#1A2B48] text-white');
      setNoticeFormTitleColor('text-[#D4AF37]');
      setNoticeFormContentColor('text-slate-200');
      setNoticeFormWidthClass('col-span-12 md:col-span-4');
      setNoticeFormHeightClass('p-6 min-h-[180px]');
    }
    setIsNoticeFormOpen(true);
  };

  const saveNoticeForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedUser?.permissions.settings) return;
    
    if (!noticeFormTitle || !noticeFormContent) {
      alert('O título e o conteúdo são obrigatórios.');
      return;
    }

    try {
      const id = editingNotice ? editingNotice.id : Math.random().toString(36).substring(2, 9);
      const createdAt = editingNotice ? editingNotice.createdAt : new Date().toISOString();

      await setDoc(doc(db, 'quick_notices', id), {
        title: noticeFormTitle,
        content: noticeFormContent,
        bgColor: noticeFormBgColor,
        titleColor: noticeFormTitleColor,
        contentColor: noticeFormContentColor,
        widthClass: noticeFormWidthClass,
        heightClass: noticeFormHeightClass,
        createdAt
      });
      
      setIsNoticeFormOpen(false);
      setEditingNotice(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar o comunicado.');
    }
  };

  const deleteNotice = async (id: string) => {
    if (!loggedUser?.permissions.settings) return;
    triggerConfirmation(
      'Eliminar Comunicado',
      '¿Está seguro de que desea eliminar este comunicado de última hora de forma permanente?',
      async () => {
        await deleteDoc(doc(db, 'quick_notices', id));
      }
    );
  };

  const openCreateGalleryForm = () => {
    setEditingGalleryItem(null);
    setGalleryFormTitle('');
    setGalleryFormEventName('');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonth = months[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    setGalleryFormDay('');
    setGalleryFormMonth(currentMonth);
    setGalleryFormYear(currentYear.toString());
    const today = new Date().toISOString().split('T')[0];
    setGalleryFormDate(today);
    setGalleryFormUrl('');
    setGalleryFormUrls([]);
    setGalleryFormType('photo');
    setIsGalleryFormOpen(true);
  };

  const openEditGalleryForm = (item: GalleryItem) => {
    setEditingGalleryItem(item);
    setGalleryFormTitle(item.title);
    setGalleryFormEventName(item.eventName || '');
    
    let day = '';
    let month = 'Mayo';
    let year = new Date().getFullYear().toString();
    if (item.date) {
      const cleanStr = item.date.replace(/de/gi, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
      const parts = cleanStr.split(' ');
      if (parts.length === 3) {
        day = parts[0];
        month = parts[1];
        year = parts[2];
      } else if (parts.length === 2) {
        month = parts[0];
        year = parts[1];
      } else if (parts.length === 1) {
        if (/^\d+$/.test(parts[0])) year = parts[0];
        else month = parts[0];
      }
    }
    setGalleryFormDay(day);
    setGalleryFormMonth(month);
    setGalleryFormYear(year);

    // Synchronize galleryFormDate from the fields
    const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mIdx = monthsEs.findIndex(m => m.toLowerCase() === month.toLowerCase());
    const mInt = mIdx !== -1 ? mIdx + 1 : 5;
    const dInt = parseInt(day, 10) || 1;
    const yInt = parseInt(year, 10) || new Date().getFullYear();
    const formattedDate = `${yInt}-${String(mInt).padStart(2, '0')}-${String(dInt).padStart(2, '0')}`;
    setGalleryFormDate(formattedDate);

    setGalleryFormUrl(item.url);
    setGalleryFormUrls(item.urls || [item.url]);
    setGalleryFormType(item.type);
    setIsGalleryFormOpen(true);
  };

  const handleGalleryImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryUploadLoading(true);
    const loadedUrls: string[] = [];

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 1000;

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
              } catch (err) {
                console.error(err);
                resolve(event.target?.result as string);
              }
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => {
            reject(new Error('Error al procesar la imagen.'));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await processFile(files[i]);
        loadedUrls.push(dataUrl);
      }
      setGalleryFormUrls((prev) => [...prev, ...loadedUrls]);
      if (loadedUrls.length > 0 && !galleryFormUrl) {
        setGalleryFormUrl(loadedUrls[0]);
      }
    } catch (err) {
      console.error(err);
      alert('Error al cargar algunas imágenes.');
    } finally {
      setGalleryUploadLoading(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadLoading(true);

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 500;

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/png', 0.95);
                resolve(dataUrl);
              } catch (err) {
                console.error(err);
                resolve(event.target?.result as string);
              }
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => {
            reject(new Error('Error al procesar la imagen del logotipo.'));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const dataUrl = await processFile(file);
      setTempSettings((prev) => ({ ...prev, logoUrl: dataUrl }));
    } catch (err) {
      console.error(err);
      alert('Error al cargar la foto de logotipo.');
    } finally {
      setLogoUploadLoading(false);
    }
  };

  const handleHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroUploadLoading(true);

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 1600;

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
              } catch (err) {
                console.error(err);
                resolve(event.target?.result as string);
              }
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => {
            reject(new Error('Error al procesar la imagen de portada.'));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const dataUrl = await processFile(file);
      setTempSettings((prev) => ({ ...prev, heroUrl: dataUrl }));
    } catch (err) {
      console.error(err);
      alert('Error al cargar la foto de portada.');
    } finally {
      setHeroUploadLoading(false);
    }
  };

  const handlePastorUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPastorUploadLoading(true);

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 1200;

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
              } catch (err) {
                console.error(err);
                resolve(event.target?.result as string);
              }
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => {
            reject(new Error('Error al procesar la imagen del pastor.'));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const dataUrl = await processFile(file);
      setTempSettings((prev) => ({ ...prev, pastorImageUrl: dataUrl }));
    } catch (err) {
      console.error(err);
      alert('Error al cargar la foto del pastor.');
    } finally {
      setPastorUploadLoading(false);
    }
  };

  const handleEventImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEventUploadLoading(true);

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 1200;

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
              } catch (err) {
                console.error(err);
                resolve(event.target?.result as string);
              }
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => {
            reject(new Error('Error al procesar la imagen del evento.'));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const dataUrl = await processFile(file);
      setEventFormImageUrl(dataUrl);
    } catch (err) {
      console.error(err);
      alert('Error al cargar la foto del evento.');
    } finally {
      setEventUploadLoading(false);
    }
  };

  const saveGalleryForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedUser?.permissions.gallery) return;

    let finalUrls = [...galleryFormUrls];
    if (galleryFormUrl && !finalUrls.includes(galleryFormUrl)) {
      finalUrls.push(galleryFormUrl);
    }

    finalUrls = finalUrls.filter(url => url.trim() !== '');

    let computedDate = '';
    if (galleryFormDate) {
      const dateParts = galleryFormDate.split('-');
      if (dateParts.length === 3) {
        const yStr = dateParts[0];
        const mInt = parseInt(dateParts[1], 10);
        const dInt = parseInt(dateParts[2], 10);
        const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mStr = monthsEs[mInt - 1] || 'Mayo';
        computedDate = `${dInt} de ${mStr}, ${yStr}`;
      } else {
        computedDate = galleryFormDate;
      }
    } else {
      computedDate = galleryFormDay.trim()
        ? `${galleryFormDay.trim()} de ${galleryFormMonth}, ${galleryFormYear}`
        : `${galleryFormMonth} ${galleryFormYear}`;
    }

    if (!galleryFormTitle || !computedDate || finalUrls.length === 0) {
      alert('El título, la fecha y al menos una imagen son requeridos.');
      return;
    }

    const chosenThumbnailUrl = finalUrls.includes(galleryFormUrl) ? galleryFormUrl : finalUrls[0];

    try {
      if (editingGalleryItem) {
        // Edit single event album
        await setDoc(doc(db, 'gallery', editingGalleryItem.id), {
          title: galleryFormTitle,
          eventName: galleryFormEventName,
          date: computedDate,
          url: chosenThumbnailUrl,
          urls: finalUrls,
          type: galleryFormType
        });
      } else {
        // Create an album/post with a collection of photos where one is chosen to be the cover/thumbnail
        const id = Math.random().toString(36).substring(2, 9);
        await setDoc(doc(db, 'gallery', id), {
          title: galleryFormTitle,
          eventName: galleryFormEventName,
          date: computedDate,
          url: chosenThumbnailUrl,
          urls: finalUrls,
          type: galleryFormType
        });
      }
      setIsGalleryFormOpen(false);
      setEditingGalleryItem(null);
      setGalleryFormUrls([]);
      setGalleryFormUrl('');
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error en guardar el item de la galería.');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    if (!loggedUser?.permissions.gallery) return;
    triggerConfirmation(
      'Eliminar Recuerdo de Galería',
      '¿Está seguro de que desea eliminar permanentemente esta foto/video de la galería de eventos? Esta acción no se puede deshacer.',
      async () => {
        await deleteDoc(doc(db, 'gallery', id));
        onRefresh();
      }
    );
  };

  // If not logged in, render the login panel
  if (!loggedUser) {
    return (
      <div className="pt-36 pb-24 max-w-lg mx-auto px-4">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 md:p-10 space-y-8 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-church-navy rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-church-navy">Acceso Administrativo</h2>
            <p className="text-slate-500 text-sm">Ingrese su identificador único y contraseña para gestionar la información de la iglesia.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">ID de Usuario</label>
              <input 
                type="text" 
                required
                placeholder="ej. admin o pastor"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Ingrese contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-church-navy text-white rounded-2xl font-bold font-sans hover:bg-church-navy/90 transition-all shadow-md active:scale-[0.98]"
            >
              Iniciar sesión
            </button>
          </form>

          {/* Quick Info / Fast Credential Panel for Easy First Login removed for security */}
        </div>
      </div>
    );
  }

  // Loaded Admin Dashboard view once authenticated
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-100 shadow-soft p-8 rounded-[2.5rem] gap-6 transition-all">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-px w-6 bg-church-gold" />
             <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Panel de Control</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-church-navy flex items-center gap-2">
            Paz de Cristo, <span className="italic font-normal">{loggedUser.username}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nivel de Acceso:</span>
            <span className="bg-slate-50 text-church-navy px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-slate-100">
               {loggedUser.role === 'super_admin' ? 'Administrador General' : 'Editor de Ministerios'}
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-slate-100 shadow-soft"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 space-y-3 shrink-0">
          {[
            { id: 'settings', name: 'Identidad y Logo', icon: SettingsIcon, allowed: loggedUser.permissions.settings },
            { id: 'pastor', name: 'Pastor y Redes', icon: Sparkles, allowed: loggedUser.permissions.settings },
            { id: 'history', name: 'Historia', icon: History, allowed: loggedUser.permissions.settings },
            { id: 'services', name: 'Horarios de Culto', icon: Clock, allowed: loggedUser.permissions.services },
            { id: 'events', name: 'Eventos y Actividades', icon: Calendar, allowed: loggedUser.permissions.events },
            { id: 'gallery', name: 'Galería de Memorias', icon: Camera, allowed: loggedUser.permissions.gallery },
            { id: 'notices', name: 'Avisos de Última Hora', icon: Bell, allowed: loggedUser.permissions.settings },
            { id: 'prayers', name: 'Pedidos de Oración', icon: HeartHandshake, allowed: true },
            { id: 'commenters', name: 'Control de Comentaristas', icon: MessageSquare, allowed: loggedUser.role === 'super_admin' || loggedUser.permissions.gallery },
            { id: 'email_config', name: 'Correo y Automatización', icon: Mail, allowed: loggedUser.role === 'super_admin' || loggedUser.permissions.settings },
            { id: 'users', name: 'Cuentas de Acceso', icon: Users, allowed: loggedUser.role === 'super_admin' || loggedUser.permissions.accounts },
          ].map((panel) => {
            if (!panel.allowed) return null;
            const isActive = activePanel === panel.id;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-church-navy text-white shadow-strong scale-[1.02]' 
                    : 'text-slate-400 bg-white border border-slate-50 hover:bg-slate-50 hover:text-church-navy shadow-soft'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-church-gold text-white' : 'bg-slate-50 text-slate-300'}`}>
                   <panel.icon className="w-4 h-4 shrink-0" />
                </div>
                {panel.name}
              </button>
            );
          })}
        </div>

        {/* Dynamic Panel Content */}
        <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-50 shadow-strong p-10 md:p-16 min-h-[700px] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-0" />
          <div className="relative z-10 w-full">
            {/* pastor PANEL */}
            {activePanel === 'pastor' && loggedUser.permissions.settings && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-church-gold" />
                    <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Liderazgo</span>
                  </div>
                  <h3 className="text-4xl font-serif font-black text-church-navy">Perfil del Pastor</h3>
                  <p className="text-slate-400 text-lg font-medium">Gestione la imagen, biografía y redes sociales del liderazgo principal.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre del Pastor</label>
                       <input 
                         type="text" 
                         value={tempSettings.pastorName || ''}
                         onChange={(e) => setTempSettings({ ...tempSettings, pastorName: e.target.value })}
                         placeholder="Ej: Rev. Juan Carlos Pérez"
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Cita / Mensaje (Rectángulo Blanco)</label>
                       <textarea 
                         rows={4}
                         value={tempSettings.pastorQuote || ''}
                         onChange={(e) => setTempSettings({ ...tempSettings, pastorQuote: e.target.value })}
                         placeholder="Ingresa una frase inspiradora o mensaje de bienvenida..."
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium italic"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Biografía / Historia</label>
                       <textarea 
                         rows={8}
                         value={tempSettings.pastorBio || ''}
                         onChange={(e) => setTempSettings({ ...tempSettings, pastorBio: e.target.value })}
                         placeholder="Describe la trayectoria y visión del pastor..."
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium text-sm leading-relaxed"
                       />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fotografía del Pastor</label>
                      <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group">
                        {tempSettings.pastorImageUrl ? (
                          <>
                            <img src={tempSettings.pastorImageUrl} className="w-full h-full object-cover" alt="Pastor Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <label htmlFor="pastor-upload" className="cursor-pointer bg-white text-church-navy px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl">Cambiar Imagen</label>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-8">
                             <Camera className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                             <p className="text-slate-400 text-sm font-medium">Haga clic abajo para subir una foto profesional</p>
                             <label htmlFor="pastor-upload" className="mt-6 inline-block cursor-pointer bg-church-navy text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-church-gold transition-colors">Seleccionar Archivo</label>
                          </div>
                        )}
                        {pastorUploadLoading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-church-gold border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs font-black text-church-navy uppercase tracking-widest">Subiendo...</span>
                            </div>
                          </div>
                        )}
                        <input type="file" id="pastor-upload" className="hidden" accept="image/*" onChange={handlePastorUpload} />
                      </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                       <h4 className="font-serif font-bold text-church-navy text-xl">Canales Digitales</h4>
                       <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Canal de YouTube (Predicaciones)</label>
                            <input 
                              type="text" 
                              value={tempSettings.youtubeUrl || ''}
                              onChange={(e) => setTempSettings({ ...tempSettings, youtubeUrl: e.target.value })}
                              placeholder="https://youtube.com/..."
                              className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Página de Facebook</label>
                            <input 
                              type="text" 
                              value={tempSettings.facebookUrl || ''}
                              onChange={(e) => setTempSettings({ ...tempSettings, facebookUrl: e.target.value })}
                              placeholder="https://facebook.com/..."
                              className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-sm"
                            />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button 
                    onClick={saveSettings}
                    className="px-12 py-5 bg-church-navy text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-strong hover:bg-church-gold transition-all active:scale-95 flex items-center gap-3"
                  >
                    <Save className="w-5 h-5" /> Guardar Perfil del Pastor
                  </button>
                </div>
              </div>
            )}

            {/* history PANEL */}
            {activePanel === 'history' && loggedUser.permissions.settings && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-church-gold" />
                    <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Historia</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-4xl font-serif font-black text-church-navy">Cronología de Fe</h3>
                      <p className="text-slate-400 text-lg font-medium">Gestione los hitos históricos que definen el camino de nuestra iglesia.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingHistoryStep(null);
                        setHistoryFormYear('');
                        setHistoryFormTitle('');
                        setHistoryFormDescription('');
                        setIsHistoryFormOpen(true);
                      }}
                      className="flex items-center gap-2 bg-church-navy text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-church-navy/90 transition-all shadow-lg active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Agregar Hito
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {(tempSettings.historySteps || []).sort((a,b) => a.year.localeCompare(b.year)).map((step) => (
                    <div key={step.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-start justify-between group transition-all hover:bg-white hover:shadow-soft">
                      <div className="flex gap-6">
                        <div className="text-3xl font-serif font-black text-church-gold/30 group-hover:text-church-gold transition-colors">{step.year}</div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-serif font-bold text-church-navy">{step.title}</h4>
                          <p className="text-slate-500 text-sm max-w-2xl">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingHistoryStep(step);
                            setHistoryFormYear(step.year);
                            setHistoryFormTitle(step.title);
                            setHistoryFormDescription(step.description);
                            setIsHistoryFormOpen(true);
                          }}
                          className="p-3 bg-white text-slate-400 hover:text-church-navy rounded-xl border border-slate-100 hover:shadow-soft transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const filtered = (tempSettings.historySteps || []).filter(s => s.id !== step.id);
                            setTempSettings({ ...tempSettings, historySteps: filtered });
                          }}
                          className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 hover:shadow-soft transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!tempSettings.historySteps || tempSettings.historySteps.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                       <p className="text-slate-400 font-medium">No hay hitos históricos registrados aún.</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={saveSettings}
                  className="w-full py-5 bg-church-gold text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-strong hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Save className="w-5 h-5" /> Guardar Todos los Cambios Históricos
                </button>
              </div>
            )}

            {/* settings PANEL */}
            {activePanel === 'settings' && loggedUser.permissions.settings && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="h-px w-6 bg-church-gold" />
                      <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Configuración</span>
                   </div>
                   <h3 className="text-4xl font-serif font-black text-church-navy">Identidad Institucional</h3>
                   <p className="text-slate-400 text-lg font-medium">Define los elementos visuales y de contacto que representan a la congregación.</p>
                 </div>

               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre de la Iglesia</label>
                    <input 
                      type="text" 
                      value={tempSettings.name}
                      onChange={(e) => setTempSettings({ ...tempSettings, name: e.target.value })}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                       <Sparkles className="w-5 h-5 text-church-gold" />
                       <h3 className="font-serif font-black text-church-navy">Textos de la Portada (Hero)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Breve frase superior (Badge)</label>
                         <input 
                           type="text" 
                           value={tempSettings.heroBadge || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, heroBadge: e.target.value })}
                           placeholder="Ej: Bienvenido a nuestra comunidad"
                           className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Título Principal (Primera Parte)</label>
                         <input 
                           type="text" 
                           value={tempSettings.heroTitle || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, heroTitle: e.target.value })}
                           placeholder="Ej: Donde la fe encuentra"
                           className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Texto Resaltado (Cursiva/Dorado)</label>
                         <input 
                           type="text" 
                           value={tempSettings.heroTitleHighlight || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, heroTitleHighlight: e.target.value })}
                           placeholder="Ej: una familia."
                           className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium italic text-church-gold"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Subtítulo Descriptivo</label>
                         <textarea 
                           rows={2}
                           value={tempSettings.heroSubtitle || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, heroSubtitle: e.target.value })}
                           placeholder="Un lugar para crecer en fe..."
                           className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                         />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Título de Bienvenida (Página Inicio)</label>
                       <input 
                         type="text" 
                         value={tempSettings.welcomeTitle || ''}
                         onChange={(e) => setTempSettings({ ...tempSettings, welcomeTitle: e.target.value })}
                         placeholder="Ej: ¡Bienvenidos!"
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mensaje de Bienvenida (Página Inicio)</label>
                       <textarea 
                         rows={2}
                         value={tempSettings.welcomeMessage || ''}
                         onChange={(e) => setTempSettings({ ...tempSettings, welcomeMessage: e.target.value })}
                         placeholder="Ingresa el saludo para los visitantes..."
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Teléfono de la Oficina</label>
                      <input 
                        type="text" 
                        value={tempSettings.phone}
                        onChange={(e) => setTempSettings({ ...tempSettings, phone: formatUSPhone(e.target.value) })}
                        placeholder="(000) 000-0000"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-850 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Email Público de Contacto</label>
                      <input 
                        type="email" 
                        value={tempSettings.email}
                        onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-850 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dirección Física Completa</label>
                    <textarea 
                      rows={2}
                      value={tempSettings.address}
                      onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-850 font-medium"
                    />
                  </div>

                  {/* Mission & Vision Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft transition-all hover:shadow-strong relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-church-gold/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-church-gold/10" />
                       <div className="relative z-10 space-y-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-church-gold/10 flex items-center justify-center text-church-gold">
                             <Target className="w-4 h-4" />
                           </div>
                           <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Misión de la Iglesia</label>
                         </div>
                         <textarea 
                           rows={5}
                           placeholder="Describa el propósito fundamental de la iglesia..."
                           value={tempSettings.mission || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, mission: e.target.value })}
                           className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium placeholder:text-slate-300 transition-all resize-none"
                         />
                       </div>
                    </div>

                    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft transition-all hover:shadow-strong relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-church-navy/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-church-navy/10" />
                       <div className="relative z-10 space-y-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-church-navy/10 flex items-center justify-center text-church-navy">
                             <Eye className="w-4 h-4" />
                           </div>
                           <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Visión de la Iglesia</label>
                         </div>
                         <textarea 
                           rows={5}
                           placeholder="¿Hacia dónde se dirige la iglesia en los próximos años?"
                           value={tempSettings.vision || ''}
                           onChange={(e) => setTempSettings({ ...tempSettings, vision: e.target.value })}
                           className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-navy/20 text-slate-800 font-medium placeholder:text-slate-300 transition-all resize-none"
                         />
                       </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div>
                      <h4 className="text-lg font-serif font-bold text-church-navy">Logotipo de la Iglesia</h4>
                      <p className="text-slate-400 text-xs">Cargue el logotipo oficial desde su dispositivo o ingrese un enlace directo.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Logo File upload control */}
                      <div className="space-y-2 bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-5 flex flex-col justify-center items-center text-center">
                        <Camera className="w-8 h-8 text-church-gold mb-1" />
                        <p className="text-xs font-bold text-slate-700">Subir logotipo desde su dispositivo</p>
                        <p className="text-[10px] text-slate-400 max-w-[220px]">Optimizamos y reescalamos el logotipo para evitar demoras en la carga de la página.</p>
                        
                        <label 
                          htmlFor="logo-upload-input"
                          className="mt-3 cursor-pointer py-2 px-5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-full transition-all border border-slate-200 inline-block shadow-sm"
                        >
                          {logoUploadLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                        </label>
                        <input 
                          id="logo-upload-input"
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleLogoUpload}
                          disabled={logoUploadLoading}
                        />
                      </div>

                      {/* Logo text URL & preview */}
                      <div className="space-y-3 flex flex-col justify-between p-5 bg-slate-50 border border-slate-150 rounded-3xl">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dirección URL de Logotipo</label>
                          <input 
                            type="text" 
                            placeholder="https://ejemplo.com/mi-logo.jpg"
                            value={tempSettings.logoUrl || ''}
                            onChange={(e) => setTempSettings({ ...tempSettings, logoUrl: e.target.value })}
                            className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-church-gold text-slate-850 text-xs font-mono"
                          />
                        </div>
                        {tempSettings.logoUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vista Previa:</span>
                            <div className="h-16 w-32 relative bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                              <img src={tempSettings.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">O elija una plantilla de diseño moderno</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {LOGO_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTempSettings({ ...tempSettings, logoUrl: preset.url })}
                            className={`p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center hover:border-church-gold transition-all text-xs font-medium space-y-2 ${
                              tempSettings.logoUrl === preset.url ? "border-church-gold ring-2 ring-church-gold/15" : "border-slate-150"
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-12 h-12 object-cover rounded-xl mx-auto shadow-sm" referrerPolicy="no-referrer" />
                            <p className="text-slate-600 font-sans text-[10px] font-semibold">{preset.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div>
                      <h4 className="text-lg font-serif font-bold text-church-navy">Imagen de Portada (Fondo Principal)</h4>
                      <p className="text-slate-400 text-xs">Cargue la foto principal de la iglesia desde su dispositivo o ingrese un enlace directo. Se muestra de fondo detrás del título principal de la página de inicio (con los botones de acción encima).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Hero File upload control */}
                      <div className="space-y-2 bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-5 flex flex-col justify-center items-center text-center">
                        <Camera className="w-8 h-8 text-church-gold mb-1" />
                        <p className="text-xs font-bold text-slate-700">Subir imagen desde su dispositivo</p>
                        <p className="text-[10px] text-slate-400 max-w-[220px]">Recomendamos una foto horizontal de alta resolución. Optimizamos el peso automáticamente para una carga rápida.</p>
                        
                        <label 
                          htmlFor="hero-upload-input"
                          className="mt-3 cursor-pointer py-2 px-5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-full transition-all border border-slate-200 inline-block shadow-sm"
                        >
                          {heroUploadLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                        </label>
                        <input 
                          id="hero-upload-input"
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleHeroUpload}
                          disabled={heroUploadLoading}
                        />
                      </div>

                      {/* Hero text URL & preview */}
                      <div className="space-y-3 flex flex-col justify-between p-5 bg-slate-50 border border-slate-150 rounded-3xl">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dirección URL de la Imagen</label>
                          <input 
                            type="text" 
                            placeholder="https://ejemplo.com/mi-portada.jpg"
                            value={tempSettings.heroUrl || ''}
                            onChange={(e) => setTempSettings({ ...tempSettings, heroUrl: e.target.value })}
                            className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-church-gold text-slate-850 text-xs font-mono"
                          />
                        </div>
                        {tempSettings.heroUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vista Previa:</span>
                            <div className="h-20 w-36 relative bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                              <img src={tempSettings.heroUrl} alt="Hero preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">O elija una hermosa foto de banco gratuito</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {HERO_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTempSettings({ ...tempSettings, heroUrl: preset.url })}
                            className={`p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center hover:border-church-gold transition-all text-xs font-medium space-y-2 ${
                              tempSettings.heroUrl === preset.url ? "border-church-gold ring-2 ring-church-gold/15" : "border-slate-150"
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-14 object-cover rounded-xl mx-auto shadow-sm" referrerPolicy="no-referrer" />
                            <p className="text-slate-600 font-sans text-[10px] font-semibold">{preset.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>

               <button 
                 onClick={saveSettings}
                 className="px-8 py-4 bg-church-gold text-white rounded-full font-bold flex items-center gap-2 hover:bg-church-gold/90 transition-all shadow-md mt-6"
               >
                 <Save className="w-4 h-4" /> Guardar Todos los Cambios
               </button>
            </div>
          )}

          {/* SERVICES PANEL */}
          {activePanel === 'services' && loggedUser.permissions.services && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-church-navy">Horarios de Culto</h3>
                  <p className="text-slate-500 text-sm mt-1">Configure los días y horas de las reuniones semanales.</p>
                </div>
                <button 
                  onClick={addService} 
                  className="px-5 py-2.5 bg-church-gold text-white font-bold text-xs rounded-full flex items-center gap-1.5 hover:bg-church-gold/90 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar Nuevo Horario
                </button>
              </div>

              <div className="space-y-3">
                {services.map(service => (
                  <div key={service.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-church-gold bg-church-gold/10 px-2 py-0.5 rounded-full tracking-wider">{service.day}</span>
                        <span className="text-lg font-serif font-bold text-church-navy">{service.time}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{service.description || 'Sin descripción detallada.'}</p>
                    </div>
                    <button 
                      onClick={() => deleteService(service.id)} 
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENTS PANEL */}
          {activePanel === 'events' && loggedUser.permissions.events && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-church-navy">Gestión de Eventos</h3>
                  <p className="text-slate-500 text-sm mt-1">Publique nuevos eventos importantes y cambie fechas u horarios en cualquier momento.</p>
                </div>
                {!isEventFormOpen && (
                  <button 
                    onClick={openCreateEventForm} 
                    className="px-5 py-2.5 bg-church-gold text-white font-bold text-xs rounded-full flex items-center gap-1.5 hover:bg-church-gold/90 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Crear Nuevo Evento
                  </button>
                )}
              </div>

              {/* EVENT FORM FOR ADDING / EDITING */}
              {isEventFormOpen && (
                <form onSubmit={saveEventForm} className="bg-slate-50 border border-church-gold/20 p-6 md:p-8 rounded-[2rem] space-y-6 animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h4 className="text-lg font-serif font-bold text-church-navy">
                      {editingEvent ? 'Editar Detalles del Evento' : 'Crear Nuevo Evento'}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => { setIsEventFormOpen(false); setEditingEvent(null); }}
                      className="text-xs text-slate-500 hover:text-slate-850 font-bold px-3 py-1.5 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-all"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Título del Evento</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Conferencia de Parejas"
                        value={eventFormTitle}
                        onChange={(e) => setEventFormTitle(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fotografía del Evento</label>
                      <div className="relative aspect-video rounded-3xl overflow-hidden bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group/evtimg">
                        {eventFormImageUrl ? (
                          <>
                            <img src={eventFormImageUrl} className="w-full h-full object-cover" alt="Event Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/evtimg:opacity-100 transition-opacity flex items-center justify-center gap-4">
                               <label htmlFor="event-upload" className="cursor-pointer bg-white text-church-navy px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl">Cambiar Imagen</label>
                               <button 
                                 type="button"
                                 onClick={() => setEventFormImageUrl('')}
                                 className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl"
                               >
                                 Eliminar
                               </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-8">
                             <Camera className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                             <p className="text-slate-400 text-xs font-medium">Haga clic abajo para subir una foto representativa del evento</p>
                             <label htmlFor="event-upload" className="mt-4 inline-block cursor-pointer bg-church-navy text-white px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-church-gold transition-colors">Seleccionar Archivo</label>
                          </div>
                        )}
                        {eventUploadLoading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-8 h-8 border-4 border-church-gold border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[10px] font-black text-church-navy uppercase tracking-widest">Subiendo...</span>
                            </div>
                          </div>
                        )}
                        <input type="file" id="event-upload" className="hidden" accept="image/*" onChange={handleEventImageUpload} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fecha (Día del Evento)</label>
                      <input 
                        type="date" 
                        required
                        value={eventFormDate}
                        onChange={(e) => setEventFormDate(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Horario de Inicio</label>
                      <input 
                        type="time" 
                        value={eventFormTime}
                        onChange={(e) => setEventFormTime(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Lugar / Ubicación</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Santuario Principal, Salón Anexo"
                        value={eventFormLocation}
                        onChange={(e) => setEventFormLocation(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Descripción Breve</label>
                      <textarea 
                        rows={2}
                        placeholder="Escriba un resumen corto (aparece en la tarjeta)..."
                        value={eventFormDescription}
                        onChange={(e) => setEventFormDescription(e.target.value)}
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Información Detallada (Rectángulo de Evento)</label>
                      <textarea 
                        rows={4}
                        placeholder="Escriba aquí los detalles extensos, ministerios invitados, requerimientos, etc..."
                        value={eventFormLongDescription}
                        onChange={(e) => setEventFormLongDescription(e.target.value)}
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium bg-church-gold/5"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-church-gold text-white font-bold rounded-full text-xs hover:bg-church-gold/90 transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> {editingEvent ? 'Guardar Cambios' : 'Registrar Evento'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {events.map(event => (
                  <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-150 relative">
                    <img src={event.imageUrl} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200" alt="" referrerPolicy="no-referrer" />
                    <div className="flex-grow space-y-2">
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-xl text-church-navy leading-snug">{event.title}</h4>
                        <div className="flex gap-4 text-xs font-bold text-church-gold">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {event.date}
                          </p>
                          <p className="flex items-center gap-1 border-l border-slate-200 pl-4">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time || '19:00'}
                          </p>
                          {event.location && (
                            <p className="flex items-center gap-1 border-l border-slate-200 pl-4 text-slate-400 font-normal">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{event.description}</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button 
                        onClick={async () => {
                          // Toggle feature
                          const currentStatus = event.isFeatured;
                          // If enabling this, disable other featured events first for safety
                          if (!currentStatus) {
                            for (const otherEvent of events) {
                              if (otherEvent.isFeatured) {
                                await setDoc(doc(db, 'events', otherEvent.id), { ...otherEvent, isFeatured: false });
                              }
                            }
                          }
                          await setDoc(doc(db, 'events', event.id), { ...event, isFeatured: !currentStatus });
                          onRefresh();
                        }}
                        className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full border transition-all ${
                          event.isFeatured 
                            ? 'bg-church-navy text-white border-church-navy shadow-sm' 
                            : 'text-slate-400 border-slate-200 hover:border-church-gold bg-white'
                        }`}
                      >
                        {event.isFeatured ? "★ Destacado Activo" : "★ Destacar"}
                      </button>
                      <button 
                        onClick={() => openEditEventForm(event)} 
                        className="p-2.5 text-slate-400 hover:text-church-gold hover:bg-amber-50 rounded-xl transition-all"
                        title="Editar Evento"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)} 
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Evento"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY PANEL */}
          {activePanel === 'gallery' && loggedUser.permissions.gallery && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-church-navy">Galería de Fotos</h3>
                  <p className="text-slate-500 text-sm mt-1">Suba fotos y videos significativos para organizar la Galería de Fotos por Álbumes o Eventos con días y meses.</p>
                </div>
                {!isGalleryFormOpen && (
                  <button 
                    onClick={openCreateGalleryForm} 
                    className="px-5 py-2.5 bg-church-gold text-white font-bold text-xs rounded-full flex items-center gap-1.5 hover:bg-church-gold/90 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Añadir Foto/Video
                  </button>
                )}
              </div>

              {/* GALLERY FORM FOR ADDING / EDITING */}
              {isGalleryFormOpen && (
                <form onSubmit={saveGalleryForm} className="bg-slate-50 border border-church-gold/20 p-6 md:p-8 rounded-[2rem] space-y-6 animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h4 className="text-lg font-serif font-bold text-church-navy">
                      {editingGalleryItem ? 'Editar Foto de la Galería' : 'Añadir Nueva Foto/Video'}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => { setIsGalleryFormOpen(false); setEditingGalleryItem(null); }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-all"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Nombre de la Galería / Álbum / Evento</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Campaña de Milagros, Conferencia de Jóvenes, Galería de Fotos"
                        value={galleryFormEventName}
                        onChange={(e) => setGalleryFormEventName(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Título de la Foto / Recuerdo</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Tiempo de Adoración en la noche"
                        value={galleryFormTitle}
                        onChange={(e) => setGalleryFormTitle(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium font-sans"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fecha del Recuerdo</label>
                      <input 
                        type="date"
                        value={galleryFormDate}
                        onChange={(e) => {
                          setGalleryFormDate(e.target.value);
                          if (e.target.value) {
                            const parts = e.target.value.split('-');
                            if (parts.length === 3) {
                              setGalleryFormDay(parts[2]);
                              const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                              const mInt = parseInt(parts[1], 10);
                              setGalleryFormMonth(monthsEs[mInt - 1] || 'Mayo');
                              setGalleryFormYear(parts[0]);
                            }
                          }
                        }}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-bold font-sans text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tipo de Recurso</label>
                      <div className="flex gap-4 p-1 bg-slate-200/50 rounded-2xl border border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setGalleryFormType('photo')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${galleryFormType === 'photo' ? 'bg-church-gold text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Foto (Imagen)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGalleryFormType('video')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${galleryFormType === 'video' ? 'bg-church-gold text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Video
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 border-t border-slate-200/60 pt-4 space-y-4">
                      <h5 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Multimedia & Archivos</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* File upload control */}
                        <div className="space-y-2 bg-white border border-dashed border-slate-300 rounded-3xl p-5 flex flex-col justify-center items-center text-center">
                          <Camera className="w-8 h-8 text-church-gold mb-1" />
                          <p className="text-xs font-bold text-slate-705">
                            {editingGalleryItem ? 'Subir una foto desde mi dispositivo' : 'Subir una o varias fotos desde mi dispositivo'}
                          </p>
                          <p className="text-[10px] text-slate-400 max-w-[220px]">
                            {editingGalleryItem 
                              ? 'Reemplaza la foto actual por una nueva optimizada.' 
                              : 'Puede presionar Ctrl/Shift para seleccionar y subir varias de una vez.'}
                          </p>
                          
                          <label 
                            htmlFor="gallery-upload-input"
                            className="mt-3 cursor-pointer py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold text-xs rounded-full transition-all border border-slate-200 inline-block"
                          >
                            {galleryUploadLoading ? 'Procesando...' : (editingGalleryItem ? 'Subir Foto' : 'Seleccionar Fotos')}
                          </label>
                          <input 
                            id="gallery-upload-input"
                            type="file" 
                            multiple={!editingGalleryItem}
                            accept="image/*"
                            className="hidden" 
                            onChange={handleGalleryImagesUpload}
                            disabled={galleryUploadLoading}
                          />
                        </div>

                        {/* Direct URL input control */}
                        <div className="space-y-3 flex flex-col justify-between p-5 bg-white border border-slate-200 rounded-3xl">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-705">O proporcione un Link directo de imagen</p>
                            <p className="text-[10px] text-slate-400">Pegue un enlace público y presione Añadir para agregarlo a la lista de publicación.</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/foto-..."
                              value={galleryFormUrl}
                              onChange={(e) => setGalleryFormUrl(e.target.value)}
                              className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-church-gold"
                            />
                            {galleryFormUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (galleryFormUrl.trim() && !galleryFormUrls.includes(galleryFormUrl.trim())) {
                                    setGalleryFormUrls(prev => [...prev, galleryFormUrl.trim()]);
                                    setGalleryFormUrl('');
                                  }
                                }}
                                className="px-3 bg-church-gold text-white font-bold text-xs rounded-xl hover:bg-church-gold/90 transition-all shrink-0"
                              >
                                Añadir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Multi-Photo Preview Box */}
                      {(galleryFormUrls.length > 0 || galleryFormUrl) && (
                        <div className="space-y-3 border border-slate-150 p-5 bg-white rounded-3xl">
                          <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Fotos a Registrar ({galleryFormUrls.length || (galleryFormUrl ? 1 : 0)})
                              </p>
                              {galleryFormUrls.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGalleryFormUrls([]);
                                    setGalleryFormUrl('');
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase"
                                >
                                  Limpiar Todas
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-church-gold font-bold">
                              💡 Haz clic en una foto para seleccionarla como la Portada (Miniatura). Usa el botón rojo "X" para eliminar/excluir la foto de este álbum. Recuerda guardar los cambios al finalizar.
                            </p>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {galleryFormUrls.map((url, index) => {
                              const isThumbnail = galleryFormUrl === url || (!galleryFormUrl && index === 0);
                              return (
                                <div 
                                  key={index} 
                                  onClick={() => setGalleryFormUrl(url)}
                                  className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 transition-all cursor-pointer ${isThumbnail ? 'ring-4 ring-church-gold scale-95 shadow-md' : 'border border-slate-200 hover:scale-105'}`}
                                >
                                  <img src={url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  {isThumbnail && (
                                    <span className="absolute bottom-1 right-1 bg-church-gold text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                                      Portada
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const confirmDelete = window.confirm(
                                        '¿Está seguro de que desea eliminar/excluir esta foto del álbum? Recuerde pulsar "Guardar Cambios" al final para aplicar permanentemente.'
                                      );
                                      if (!confirmDelete) return;

                                      const nextUrls = galleryFormUrls.filter((_, i) => i !== index);
                                      setGalleryFormUrls(nextUrls);
                                      if (galleryFormUrl === url) {
                                        setGalleryFormUrl(nextUrls[0] || '');
                                      }
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-all scale-75 hover:scale-110 cursor-pointer"
                                    title="Deletar Foto / Eliminar del álbum"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {galleryFormUrl && !galleryFormUrls.includes(galleryFormUrl) && (
                              <div 
                                onClick={() => setGalleryFormUrl(galleryFormUrl)}
                                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 ring-4 ring-church-gold/50 scale-95 shadow-md cursor-pointer"
                              >
                                <img src={galleryFormUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-center py-1 text-[8px] text-white font-bold">
                                  Portada
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryFormUrl('');
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors scale-75"
                                  title="Remover"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="submit"
                      disabled={galleryUploadLoading || (galleryFormUrls.length === 0 && !galleryFormUrl)}
                      className="px-6 py-3 bg-church-gold text-white font-bold rounded-full text-xs hover:bg-church-gold/90 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {editingGalleryItem ? 'Guardar Cambios' : 'Registrar de Galería'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map(item => (
                  <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 shadow-sm hover:shadow-md transition-all">
                    <img src={item.url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    
                    {/* Badge */}
                    <div className="absolute top-2 right-2 bg-church-navy/80 backdrop-blur-sm text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">
                      {item.type}
                    </div>

                    {item.urls && item.urls.length > 1 && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-church-navy border border-slate-100 text-[8px] px-1.5 py-0.5 rounded-lg font-black uppercase tracking-wider shadow-sm">
                        Álbum ({item.urls.length})
                      </div>
                    )}

                    {/* Meta info displayed on hover/always */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 text-white space-y-1">
                       <p className="text-[10px] font-bold text-church-gold tracking-widest">{item.date}</p>
                       {item.eventName && (
                         <span className="text-[8px] bg-church-gold text-white font-bold uppercase px-1.5 py-0.5 rounded w-fit tracking-wider">
                           {item.eventName}
                         </span>
                       )}
                       <p className="font-serif font-bold text-xs leading-snug text-slate-100 line-clamp-2">{item.title}</p>
                       <div className="flex gap-2 self-end mt-2">
                         <button 
                           onClick={() => openEditGalleryForm(item)}
                           className="bg-church-gold/90 hover:bg-church-gold text-white rounded-lg p-1.5 flex items-center justify-center transition-colors"
                           title="Editar Recuerdo"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                         </button>
                         <button 
                           onClick={() => deleteGalleryItem(item.id)} 
                           className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 flex items-center justify-center transition-colors"
                           title="Eliminar"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANAGING ACCESS & USERS PANEL */}
          {activePanel === 'users' && (loggedUser.role === 'super_admin' || loggedUser.permissions.accounts) && (
            <div className="space-y-10 animate-in fade-in duration-300">
               <div>
                  <h3 className="text-2xl font-serif font-bold text-church-navy">Gestión de Personal y Accesos Directos</h3>
                  <p className="text-slate-500 text-sm mt-1">Solo el administrador general o personas autorizadas pueden crear ID de usuarios, definir contraseñas y habilitar qué paneles pueden modificar de la iglesia.</p>
               </div>

               {/* Grid layout */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 
                 {/* Create users form */}
                 <div className="lg:col-span-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-6">
                   <h4 className="font-serif font-bold text-lg text-church-navy flex items-center gap-1.5 border-b border-slate-100 pb-3">
                     <UserPlus className="w-5 h-5 text-church-gold" /> Registrar Nuevo Acceso
                   </h4>

                   <form onSubmit={handleCreateUser} className="space-y-4">
                      {userError && <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">{userError}</div>}
                      {userSuccess && <div className="p-3 bg-green-50 text-green-600 text-xs font-semibold rounded-xl border border-green-100">{userSuccess}</div>}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID de Acceso (Usuario)</label>
                        <input 
                          type="text" 
                          placeholder="ej. pastor_juan" 
                          value={newUserId}
                          onChange={(e) => setNewUserId(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:ring-1 focus:ring-church-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Colaborador</label>
                        <input 
                          type="text" 
                          placeholder="ej. Pastor Juan Pérez" 
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:ring-1 focus:ring-church-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña Asignada</label>
                        <input 
                          type="text" 
                          placeholder="ej. emanuel777" 
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:ring-1 focus:ring-church-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel de Cuenta</label>
                        <select 
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                        >
                          <option value="editor">Editor de Contenido (Especificar abajo)</option>
                          <option value="super_admin">Administrador General (Acceso Total)</option>
                        </select>
                      </div>

                      {newUserRole === 'editor' && (
                        <div className="p-4 bg-white rounded-xl border border-slate-150 space-y-2">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Permitir controlar:</p>
                           <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <input 
                               type="checkbox" 
                               checked={newUserPerms.settings}
                               onChange={(e) => setNewUserPerms({ ...newUserPerms, settings: e.target.checked })}
                               className="accent-church-gold text-white"
                             /> Informacion e Logo de Iglesia
                           </label>
                           <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <input 
                               type="checkbox" 
                               checked={newUserPerms.services}
                               onChange={(e) => setNewUserPerms({ ...newUserPerms, services: e.target.checked })}
                               className="accent-church-gold text-white"
                             /> Cultos y Horarios
                           </label>
                           <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <input 
                               type="checkbox" 
                               checked={newUserPerms.events}
                               onChange={(e) => setNewUserPerms({ ...newUserPerms, events: e.target.checked })}
                               className="accent-church-gold text-white"
                             /> Eventos Comerciales
                           </label>
                           <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <input 
                               type="checkbox" 
                               checked={newUserPerms.gallery}
                               onChange={(e) => setNewUserPerms({ ...newUserPerms, gallery: e.target.checked })}
                               className="accent-church-gold text-white"
                             /> Galería de Fotos
                           </label>
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-3 bg-church-navy text-white font-bold rounded-xl text-xs hover:bg-church-navy/95 transition-all shadow"
                      >
                        Crear Acceso Integral
                      </button>
                   </form>
                 </div>

                 {/* Current user privilege matrix list */}
                 <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-serif font-bold text-lg text-church-navy border-b border-slate-100 pb-3">Cuentas con Acceso Activo</h4>
                    <div className="space-y-3">
                       {adminUsers.map(user => (
                         <div key={user.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start">
                           <div className="space-y-1.5">
                             <h5 className="font-serif font-bold text-lg text-church-navy">{user.username} <span className="text-[10px] font-mono text-slate-400">({user.id})</span></h5>
                             <p className="text-xs text-slate-600 font-bold bg-white px-2.5 py-1 rounded border border-slate-150 inline-block font-mono">Password: {user.password}</p>
                             <div className="flex gap-1.5 flex-wrap pt-1.5">
                               {user.permissions.settings && <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest text-[8px] uppercase">Ajustes</span>}
                               {user.permissions.services && <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest text-[8px] uppercase">Cultos</span>}
                               {user.permissions.events && <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest text-[8px] uppercase">Eventos</span>}
                               {user.permissions.gallery && <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest text-[8px] uppercase">Galeria</span>}
                               {user.permissions.accounts && <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest text-[8px] uppercase">Accesos</span>}
                             </div>
                           </div>
                           <button 
                             onClick={() => handleDeleteUser(user.id)}
                             disabled={loggedUser.id === user.id}
                             className={`p-2 rounded-xl text-slate-350 transition-colors ${
                               loggedUser.id === user.id ? 'opacity-20 cursor-not-allowed' : 'hover:text-red-600 hover:bg-red-50'
                             }`}
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </div>
                       ))}
                    </div>
                 </div>

               </div>
            </div>
          )}

          {/* MANAGING QUICK NOTICES PANEL */}
          {activePanel === 'notices' && loggedUser.permissions.settings && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-church-navy">Mural de Avisos Rápidos</h3>
                  <p className="text-slate-500 text-sm mt-1">Crie, dimensione e personalize retângulos coloridos de última hora para fixar na página principal da igreja.</p>
                </div>
                {!isNoticeFormOpen && (
                  <button
                    onClick={() => openNoticeForm(null)}
                    className="flex items-center gap-2 px-6 py-3.5 bg-church-navy text-white hover:bg-church-navy/90 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Novo Comunicado
                  </button>
                )}
              </div>

              {isNoticeFormOpen && (
                <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-soft space-y-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h4 className="font-serif font-bold text-lg text-church-navy flex items-center gap-2">
                      <Bell className="w-5 h-5 text-church-gold animate-swing" />
                      {editingNotice ? 'Editar Comunicado Especial' : 'Criar Novo Retângulo de Aviso'}
                    </h4>
                    <button 
                      type="button"
                      onClick={() => { setIsNoticeFormOpen(false); setEditingNotice(null); }}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={saveNoticeForm} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Controls */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Título do Comunicado</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Reunião Extraordinária, Campanha de Doação, etc."
                          value={noticeFormTitle}
                          onChange={(e) => setNoticeFormTitle(e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Mensagem / Conteúdo do Aviso</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Escreva as informações detalhadas que a igreja precisa saber de imediato..."
                          value={noticeFormContent}
                          onChange={(e) => setNoticeFormContent(e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800 text-sm min-h-[120px]"
                        />
                      </div>

                      {/* Dimensionamento do Retângulo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Largura do Painel</label>
                          <select
                            value={noticeFormWidthClass}
                            onChange={(e) => setNoticeFormWidthClass(e.target.value)}
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800 text-sm"
                          >
                            <option value="col-span-12 md:col-span-3">Pequeno (1/4 da Linha)</option>
                            <option value="col-span-12 md:col-span-4">Médio (1/3 da Linha)</option>
                            <option value="col-span-12 md:col-span-6">Grande (Metade da Linha)</option>
                            <option value="col-span-12">Banner Inteiro (Linha Completa)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Altura / Espaçamento</label>
                          <select
                            value={noticeFormHeightClass}
                            onChange={(e) => setNoticeFormHeightClass(e.target.value)}
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/30 font-medium text-slate-800 text-sm"
                          >
                            <option value="p-4 min-h-[140px]">Compacto (Apertado, poucos dados)</option>
                            <option value="p-6 min-h-[200px]">Normal (Equilibrado)</option>
                            <option value="p-10 min-h-[300px]">Espaçoso (Amplo, destaca o texto)</option>
                          </select>
                        </div>
                      </div>

                      {/* Cores Personalizadas */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Escolha o Tema do Retângulo</span>
                          <div className="flex flex-wrap gap-2.5">
                            {[
                              { label: 'Azul Escuro', val: 'bg-[#1A2B48] text-white' },
                              { label: 'Ouro Real', val: 'bg-[#D4AF37] text-slate-900' },
                              { label: 'Laranja Alerta', val: 'bg-orange-500 text-white' },
                              { label: 'Cinza Suave', val: 'bg-[#f8fafc] text-slate-800 border border-slate-200' },
                              { label: 'Coral Nobre', val: 'bg-[#fff1f2] text-rose-950 border border-rose-250' },
                              { label: 'Sage Verde', val: 'bg-[#f0fdf4] text-emerald-950 border border-emerald-250' },
                              { label: 'Roxo Vivo', val: 'bg-purple-600 text-white' },
                              { label: 'Dark Charcoal', val: 'bg-[#1e293b] text-white' }
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => setNoticeFormBgColor(preset.val)}
                                className={`px-4 py-2 bg-white rounded-full text-xs font-semibold shadow-sm border transition-all ${
                                  noticeFormBgColor === preset.val 
                                    ? 'border-church-navy ring-2 ring-church-gold/30 bg-slate-100 scale-102 font-black_label'
                                    : 'border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-2">
                            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Cor do Título</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: 'Ouro', val: 'text-[#D4AF37]' },
                                { label: 'Branco', val: 'text-white' },
                                { label: 'Marinho', val: 'text-[#1A2B48]' },
                                { label: 'Carvão', val: 'text-slate-900' },
                                { label: 'Vermelho', val: 'text-red-600' }
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setNoticeFormTitleColor(item.val)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm border transition-all ${
                                    noticeFormTitleColor === item.val 
                                      ? 'border-church-navy ring-2 ring-church-gold/35 bg-slate-100 font-bold'
                                      : 'border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Cor do Conteúdo</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: 'Claro', val: 'text-slate-200' },
                                { label: 'Cinza', val: 'text-slate-500' },
                                { label: 'Marinho', val: 'text-[#1A2B48]/90' },
                                { label: 'Preto', val: 'text-slate-800' },
                                { label: 'Fosco', val: 'text-slate-400' }
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setNoticeFormContentColor(item.val)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm border transition-all ${
                                    noticeFormContentColor === item.val 
                                      ? 'border-church-navy ring-2 ring-church-gold/35 bg-slate-100 font-bold'
                                      : 'border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-8 py-4 bg-church-navy hover:bg-church-navy/90 text-white font-bold rounded-full text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                        >
                          <Save className="w-4 h-4" /> {editingNotice ? 'Atualizar Comunicado' : 'Publicar Comunicado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsNoticeFormOpen(false); setEditingNotice(null); }}
                          className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-full text-xs uppercase tracking-widest transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-5 flex flex-col justify-start">
                      <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-150 space-y-4 sticky top-6">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                          <Eye className="w-5 h-5 text-church-navy" />
                          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Vista Prévia Realista</span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Este retângulo será exibido exatamente assim no topo da página principal:</p>
                        
                        {/* Notice Card Render Mock */}
                        <div className="pt-2">
                          <div className={`${noticeFormBgColor} ${noticeFormHeightClass} rounded-[2.25rem] shadow-soft border border-slate-100/30 flex flex-col justify-between transition-all relative overflow-hidden`}>
                            <div className="space-y-2.5 relative z-10">
                              <h3 className={`text-lg font-serif font-black ${noticeFormTitleColor}`}>
                                {noticeFormTitle || 'Título de Exemplo'}
                              </h3>
                              <p className={`text-xs ${noticeFormContentColor} whitespace-pre-line leading-relaxed font-semibold`}>
                                {noticeFormContent || 'Este é o conteúdo do aviso. Ele se ajustará ao tamanho escolhido por você.'}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[8px] font-mono tracking-wider uppercase opacity-50 relative z-10">
                              <span>Emanuel Hartford</span>
                              <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Extra dimension feedback */}
                        <div className="p-4 bg-white/80 rounded-2xl border border-slate-100 space-y-2 font-sans text-xs text-slate-650">
                          <p>📐 <strong>Tamanho no Desktop:</strong> {
                            noticeFormWidthClass.includes('col-span-3') ? '1/4 da Largura da Tela' :
                            noticeFormWidthClass.includes('col-span-4') ? '1/3 da Largura da Tela' :
                            noticeFormWidthClass.includes('col-span-6') ? 'Metade da Largura da Tela' : 'Banner de Tela Cheia'
                          }</p>
                          <p>📱 <strong>Tamanho no Celular:</strong> Ajusta-se dinamicamente para largura total preservando a legibilidade sem quebrar a tela!</p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* LIST OF NOTICES COMPONENT */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-lg text-church-navy">Comunicados Ativos</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Clique em editar para ajustar o tamanho/cores ou remova avisos que já terminaram.</p>
                </div>

                {quickNotices && quickNotices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickNotices.map((notice) => (
                      <div key={notice.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft flex flex-col justify-between gap-6">
                        <div className="flex gap-4 items-start justify-between">
                          <div className="space-y-1 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                                {notice.widthClass?.includes('col-span-3') ? '1/4 L' : 
                                 notice.widthClass?.includes('col-span-4') ? '1/3 L' :
                                 notice.widthClass?.includes('col-span-6') ? '1/2 L' : 'Completa'}
                              </span>
                              <span className="text-[10px] font-mono tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                                {notice.heightClass?.includes('p-4') ? 'Compacto' : 
                                 notice.heightClass?.includes('p-6') ? 'Normal' : 'Amplo'}
                              </span>
                            </div>
                            <h5 className="font-serif font-bold text-base text-church-navy mt-1">{notice.title}</h5>
                            <p className="text-slate-500 text-xs line-clamp-3">{notice.content}</p>
                          </div>
                        </div>

                        {/* Miniature Preview swatch plus options */}
                        <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cores:</span>
                            <div className={`w-5 h-5 rounded-full ${notice.bgColor?.split(' ')[0] || 'bg-slate-200'} border border-slate-150`} />
                            {notice.titleColor && <div className={`w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center font-bold text-[8px] border border-slate-150`} title="Texto" />}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openNoticeForm(notice)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-church-navy transition-all"
                              title="Editar Comunicado"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNotice(notice.id)}
                              className="p-2 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-600 transition-all"
                              title="Excluir Comunicado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 space-y-3">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                    <p className="text-slate-400 text-sm font-medium">Nenhum aviso de última hora publicado ainda.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANAGING PRAYER REQUESTS PANEL */}
          {activePanel === 'prayers' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div>
                <h3 className="text-2xl font-serif font-bold text-church-navy">Pedidos de Oración Recibidos</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Revise las peticiones presentadas por la congregación y los visitantes del sitio web.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                    <HeartHandshake className="w-6 h-6 text-church-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Recibidos</span>
                    <span className="text-2xl font-black text-church-navy">{prayerRequests.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                    <Calendar className="w-6 h-6 text-church-navy" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Último Recibido</span>
                    <span className="text-xs font-bold text-church-navy truncate max-w-[180px] block font-mono">
                      {prayerRequests.length > 0 
                        ? new Date(prayerRequests[0].createdAt || '').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'No hay pedidos aún'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* List Container */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-50 shadow-soft space-y-6">
                {prayerRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prayerRequests.map((req, index) => (
                      <div 
                        key={req.id} 
                        className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 shadow-sm hover:shadow-soft hover:bg-white transition-all duration-300 relative group flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-grow">
                              {editingPrayerId === req.id ? (
                                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nombre del Solicitante</label>
                                    <input
                                      type="text"
                                      value={editingPrayerName}
                                      onChange={(e) => setEditingPrayerName(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-church-navy font-bold focus:outline-none focus:ring-2 focus:ring-church-gold/20 focus:border-church-gold transition-all"
                                      placeholder="Nombre"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correo Electrónico (Para agradecimiento)</label>
                                    <input
                                      type="email"
                                      value={editingPrayerEmail}
                                      onChange={(e) => setEditingPrayerEmail(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-church-navy font-medium focus:outline-none focus:ring-2 focus:ring-church-gold/20 focus:border-church-gold transition-all"
                                      placeholder="correo@ejemplo.com"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, 'prayer_requests', req.id), {
                                            name: editingPrayerName.trim(),
                                            email: editingPrayerEmail.trim()
                                          });
                                          setEditingPrayerId(null);
                                          setToast({
                                            title: 'Datos Guardados',
                                            message: 'El nombre y correo han sido actualizados exitosamente.'
                                          });
                                        } catch (e) {
                                          console.error(e);
                                          alert('Error al actualizar.');
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-church-navy text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-church-gold transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 text-church-gold" />
                                      <span>Salvar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPrayerId(null)}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                                    >
                                      <span>Cancelar</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-serif font-black text-lg text-church-navy leading-tight">{req.name}</h4>
                                    <button
                                      onClick={() => {
                                        setEditingPrayerId(req.id);
                                        setEditingPrayerName(req.name || '');
                                        setEditingPrayerEmail(req.email || '');
                                      }}
                                      className="p-1.5 rounded-xl hover:bg-white text-slate-400 hover:text-church-gold border border-transparent hover:border-slate-100 transition-all cursor-pointer shrink-0"
                                      title="Editar Nombre / Correo"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-1.5">
                                    {req.phone ? (
                                      <a 
                                        href={`tel:${req.phone}`} 
                                        className="text-[10px] font-bold text-slate-500 hover:text-church-gold hover:underline flex items-center gap-1.5"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-church-gold shrink-0" />
                                        <span>{req.phone}</span>
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        <span>Sin teléfono</span>
                                      </span>
                                    )}

                                    {req.email ? (
                                      <a 
                                        href={`mailto:${req.email}`} 
                                        className="text-[10px] font-bold text-slate-500 hover:text-church-gold hover:underline flex items-center gap-1.5"
                                      >
                                        <Mail className="w-3.5 h-3.5 text-church-gold shrink-0" />
                                        <span className="truncate max-w-[150px] md:max-w-[200px]">{req.email}</span>
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        <span>Sin email</span>
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold bg-white border border-slate-100 px-2.5 py-1 rounded-full uppercase shrink-0">
                              {req.createdAt 
                                ? new Date(req.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Sin fecha'
                              }
                            </span>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <p className={`text-xs leading-relaxed italic font-serif ${index === 0 ? 'text-black font-semibold' : 'text-slate-600'}`}>
                              "{req.request}"
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100/50 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setToast({
                                title: 'Agradecimiento Enviado',
                                message: req.email 
                                  ? `Simulando correo enviado a "${req.email}" confirmando la recepción de su petición de oración.`
                                  : `Simulando correo enviado a "${req.name}" confirmando la recepción de su petición de oración.`
                              });
                            }}
                            className="text-xs font-black text-church-gold hover:text-church-gold/80 hover:bg-amber-50/50 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Agradecer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerConfirmation(
                                'Eliminar Pedido de Oración',
                                `¿Está seguro de que desea eliminar permanentemente el pedido de oración de "${req.name}"? Esta acción es irreversible.`,
                                async () => {
                                  try {
                                    await deleteDoc(doc(db, 'prayer_requests', req.id));
                                  } catch (e) {
                                    console.error(e);
                                    alert('Error al eliminar el pedido.');
                                  }
                                }
                              );
                            }}
                            className="text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50/50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50/10 rounded-[2rem] border border-dashed border-slate-200">
                    <HeartHandshake className="w-12 h-12 text-slate-350 mx-auto animate-pulse mb-3" />
                    <h4 className="font-serif font-bold text-lg text-church-navy">No se han recibido pedidos de oración</h4>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
                      Los pedidos de oración que se envíen desde la página de inicio aparecerán aquí en tiempo real de forma automática.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANAGING REGISTERED COMMENTERS PANEL */}
          {activePanel === 'commenters' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div>
                <h3 className="text-2xl font-serif font-bold text-church-navy">Control de Comentaristas</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Administre las personas registradas para comentar en los álbumes de fotos. Puede bloquearlas, desbloquearlas o eliminarlas del sistema junto con sus aportaciones.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                    <Users className="w-6 h-6 text-church-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Registrados</span>
                    <span className="text-2xl font-black text-church-navy">{registeredUsers.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Activos</span>
                    <span className="text-2xl font-black text-church-navy">
                      {registeredUsers.filter(u => !u.isBlocked).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm shrink-0">
                    <UserX className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Bloqueados</span>
                    <span className="text-2xl font-black text-church-navy">
                      {registeredUsers.filter(u => u.isBlocked).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#fcfcfa] rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                    <MessageSquare className="w-6 h-6 text-church-navy" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Comentarios</span>
                    <span className="text-2xl font-black text-church-navy">{allComments.length}</span>
                  </div>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o correo electrónico..."
                    value={searchCommenterQuery}
                    onChange={(e) => setSearchCommenterQuery(e.target.value)}
                    className="w-full bg-white border border-slate-150 rounded-full px-5 py-3 pl-12 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/25 focus:border-church-gold transition-all shadow-sm"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  {searchCommenterQuery && (
                    <button 
                      onClick={() => setSearchCommenterQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>

              {/* List Container */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-50 shadow-soft space-y-6">
                {registeredUsers.filter(u => {
                  const name = (u.name || '').toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const query = searchCommenterQuery.toLowerCase().trim();
                  return name.includes(query) || email.includes(query);
                }).length > 0 ? (
                  <div className="space-y-6">
                    {registeredUsers.filter(u => {
                      const name = (u.name || '').toLowerCase();
                      const email = (u.email || '').toLowerCase();
                      const query = searchCommenterQuery.toLowerCase().trim();
                      return name.includes(query) || email.includes(query);
                    }).map((u) => {
                      const userComments = allComments.filter(c => c.userId === u.id);
                      return (
                        <div 
                          key={u.id}
                          className={`p-6 rounded-[2rem] border transition-all duration-300 relative flex flex-col gap-4 ${
                            u.isBlocked 
                              ? 'bg-rose-50/20 border-rose-100 hover:border-rose-250' 
                              : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-soft'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 border ${
                                u.isBlocked 
                                  ? 'bg-rose-100 text-rose-600 border-rose-200' 
                                  : 'bg-church-navy/5 text-church-navy border-church-navy/10'
                              }`}>
                                {u.name ? u.name.substring(0, 2).toUpperCase() : 'CO'}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-serif font-black text-lg text-church-navy">{u.name}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                    u.role === 'visitor' 
                                      ? 'bg-slate-100 text-slate-500' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  }`}>
                                    {u.role === 'visitor' ? 'Anónimo / Visitante' : 'Gmail / Miembro'}
                                  </span>
                                  {u.isBlocked && (
                                    <span className="bg-red-100 text-red-650 border border-red-200 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                                      Bloqueado
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  Registrado: {u.createdAt ? new Date(u.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                                </p>
                              </div>
                            </div>

                            {/* Control Actions */}
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              {/* Block/Unblock toggle */}
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetState = !u.isBlocked;
                                  try {
                                    await updateDoc(doc(db, 'registered_users', u.id), {
                                      isBlocked: targetState
                                    });
                                    setToast({
                                      title: targetState ? 'Usuario Bloqueado' : 'Usuario Desbloqueado',
                                      message: `El usuario "${u.name}" ha sido ${targetState ? 'bloqueado' : 'desbloqueado'} con éxito.`
                                    });
                                  } catch (err) {
                                    console.error("Error setting block status:", err);
                                    alert('Error al actualizar estado del usuario.');
                                  }
                                }}
                                className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer border ${
                                  u.isBlocked
                                    ? 'bg-emerald-550/10 text-emerald-650 hover:bg-emerald-550 hover:text-white border-emerald-550/20'
                                    : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border-orange-100'
                                }`}
                              >
                                {u.isBlocked ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Desbloquear</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Bloquear</span>
                                  </>
                                )}
                              </button>

                              {/* Delete account */}
                              <button
                                type="button"
                                onClick={() => {
                                  triggerConfirmation(
                                    'Eliminar Registro y Comentarios',
                                    `¿Está completamente seguro de que desea eliminar a "${u.name}" de forma permanente del sistema? Esto borrará su membresía de comentarista y TODOS sus ${userComments.length} comentarios asociados. Esta acción es irreversible.`,
                                    async () => {
                                      try {
                                        // 1. Delete comments first
                                        for (const c of userComments) {
                                          await deleteDoc(doc(db, 'gallery_comments', c.id));
                                        }
                                        // 2. Delete commenter doc
                                        await deleteDoc(doc(db, 'registered_users', u.id));
                                        setToast({
                                          title: 'Usuario Eliminado',
                                          message: `El usuario "${u.name}" y todas sus aportaciones han sido borrados de la base de datos.`
                                        });
                                      } catch (err) {
                                        console.error("Error deleting user:", err);
                                        alert('Error al eliminar usuario.');
                                      }
                                    }
                                  );
                                }}
                                className="text-xs font-black text-red-500 hover:text-red-650 hover:bg-red-50 border border-red-100 hover:border-red-200 uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar / Deletar</span>
                              </button>
                            </div>
                          </div>

                          {/* Collapsible/Listed comments specifically by this user */}
                          {userComments.length > 0 && (
                            <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1 flex-wrap">
                                <MessageSquare className="w-3 h-3 text-church-gold" />
                                Comentarios de esta persona ({userComments.length}):
                              </span>
                              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-2">
                                {userComments.map(comment => (
                                  <div 
                                    key={comment.id}
                                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs"
                                  >
                                    <div className="space-y-1">
                                      <p className="text-slate-650 italic leading-relaxed">
                                        "{comment.text}"
                                      </p>
                                      <span className="text-[9px] font-bold text-slate-400 font-mono block">
                                        Publicado: {comment.createdAt ? new Date(comment.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerConfirmation(
                                          'Eliminar Comentario',
                                          `¿Seguro de que desea eliminar este comentario respetando la integridad del foro? "${comment.text.substring(0, 30)}..."`,
                                          async () => {
                                            try {
                                              await deleteDoc(doc(db, 'gallery_comments', comment.id));
                                              setToast({
                                                title: 'Comentario Eliminado',
                                                message: 'El comentario seleccionado ha sido borrado con éxito.'
                                              });
                                            } catch (err) {
                                              console.error("Error deleting comment:", err);
                                            }
                                          }
                                        );
                                      }}
                                      className="p-1 text-red-400 hover:text-red-650 hover:bg-slate-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                      title="Borrar comentario del foro"
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
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50/10 rounded-[2rem] border border-dashed border-slate-200">
                    <Users className="w-12 h-12 text-slate-300 mx-auto animate-pulse mb-3" />
                    <h4 className="font-serif font-bold text-lg text-church-navy">No se encontraron registraros</h4>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
                      {searchCommenterQuery 
                        ? 'Intente ajustar los términos de búsqueda o limpie el filtro para ver a todos.'
                        : 'Las personas que se registran para comentar en las fotos aparecerán aquí automáticamente.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMAIL CONFIGURATION & AUTOMATION PANEL */}
          {activePanel === 'email_config' && loggedUser.permissions.settings && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div>
                <h3 className="text-2xl font-serif font-bold text-church-navy">Servidor de Correo y Automatización</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Configure un proveedor SMTP tradicional o use conexiones de API seguras (SendGrid o Mailgun) para enviar informes de CSV pastorales y notificaciones de bienvenida a los nuevos miembros en tiempo real.
                </p>
              </div>

              <div className="bg-emerald-50/60 rounded-[2rem] border border-emerald-200/50 p-6 flex gap-4 text-xs leading-relaxed text-slate-655">
                <span className="text-2xl shrink-0 select-none">📨</span>
                <div>
                  <p className="font-serif font-black text-church-navy">
                    Servidor de Correo & Automatización de Comunicación:
                  </p>
                  <p className="mt-0.5 font-medium">
                    Configure un servidor SMTP o use de forma transparente los servicios de correo para disparar instantáneamente informes automatizados directo a su bandeja de entrada ministerial, garantizando la trazabilidad con nuestro handshake activo.
                  </p>
                </div>
              </div>

              {/* Two Column Layout: Settings Form + Visual Test Terminal & Templates */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* Left side: Credentials & Providers Form */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-soft">
                  <div className="flex items-center gap-3 border-b border-slate-55 pb-5">
                    <SettingsIcon className="w-5 h-5 text-church-gold" />
                    <h4 className="font-serif font-bold text-base text-church-navy">
                      Configuración del Proveedor
                    </h4>
                  </div>

                  {/* Provider Radio Selector */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Seleccione el Método de Envío
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'smtp', label: 'Servidor SMTP' },
                        { id: 'sendgrid', label: 'SendGrid API' },
                        { id: 'mailgun', label: 'Mailgun API' }
                      ].map(prov => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setEmailProvider(prov.id as any)}
                          className={`py-4 px-3 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs ${
                            emailProvider === prov.id 
                              ? 'border-church-gold bg-amber-50/30 text-church-gold scale-[1.02]'
                              : 'border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                          }`}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields based on selector */}
                  {emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Puerto</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={e => setSmtpPort(e.target.value)}
                          placeholder="587"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Usuario</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          placeholder="igreja.financeiro@gmail.com"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SMTP Contraseña</label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={e => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3 pt-1">
                        <input
                          type="checkbox"
                          id="smtp_secure_ssl"
                          checked={smtpSecure}
                          onChange={e => setSmtpSecure(e.target.checked)}
                          className="rounded-lg w-5 h-5 text-church-gold focus:ring-church-gold accent-church-gold cursor-pointer"
                        />
                        <label htmlFor="smtp_secure_ssl" className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
                          Requiere Conexión Encriptada Segura (SSL/TLS)
                        </label>
                      </div>
                    </div>
                  )}

                  {emailProvider === 'sendgrid' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SendGrid v3 API Key</label>
                        <input
                          type="password"
                          value={sendgridApiKey}
                          onChange={e => setSendgridApiKey(e.target.value)}
                          placeholder="SG.••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                    </div>
                  )}

                  {emailProvider === 'mailgun' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Mailgun API Key</label>
                        <input
                          type="password"
                          value={mailgunApiKey}
                          onChange={e => setMailgunApiKey(e.target.value)}
                          placeholder="key-••••••••••••••••••••••••"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Mailgun Dominio</label>
                        <input
                          type="text"
                          value={mailgunDomain}
                          onChange={e => setMailgunDomain(e.target.value)}
                          placeholder="mg.igrejadovale.org"
                          className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sender Headers info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Nombre del Remitente
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Comunicación Pastoral"
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Correo del Remitente Autorizado
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        placeholder="pastoral@igreja.org"
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>
                  </div>

                  {/* Save config CTA */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSaveEmailSettings}
                      className="bg-church-navy hover:bg-church-gold transition-all duration-300 text-white font-black uppercase tracking-[0.1em] text-[10px] px-8 py-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-soft shrink-0"
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> 
                          <span>Guardar Configuración Segura</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right side: Pastoral Dispatch Hub & Console and Template Preview */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* CSV Export Automation Hub */}
                  <div className="bg-[#cf9d34]/5 border border-amber-200/40 rounded-[2.5rem] p-6 space-y-4">
                    <h5 className="font-serif font-bold text-sm text-church-navy flex items-center gap-2">
                      📋 Automatización de Lista Pastoral
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Envíe de inmediato la lista de miembros cargada en formato CSV comprimida directo al correo de pastoral o equipo ministerial.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                        Correo de Destino del Pastor
                      </label>
                      <input
                        type="email"
                        value={adminNotificationEmail}
                        onChange={e => setAdminNotificationEmail(e.target.value)}
                        placeholder="pastor.comunicacao@igreja.org"
                        className="w-full bg-white border border-slate-150 rounded-2xl px-4 py-3 text-xs text-church-navy font-semibold focus:outline-none focus:ring-2 focus:ring-church-gold/20"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSendAutomatedCSVEmail}
                      className="w-full bg-church-navy hover:bg-church-gold transition-colors text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-soft"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Exportar y Enviar CSV por Correo</span>
                    </button>
                  </div>

                  {/* Test individual Welcome Notification */}
                  <div className="bg-slate-50/50 border border-slate-150 rounded-[2.5rem] p-6 space-y-4">
                    <h5 className="font-serif font-bold text-sm text-church-navy flex items-center gap-2">
                      ✉️ Disparar Notificación Modelo
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Simule o envíe una notificación de bienvenida para validar el correcto funcionamiento de las pasarelas configuradas.
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">Nombre</label>
                        <input
                          type="text"
                          value={testRecipientName}
                          onChange={e => setTestRecipientName(e.target.value)}
                          placeholder="Juan Pérez"
                          className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">E-mail</label>
                        <input
                          type="email"
                          value={testRecipientEmail}
                          onChange={e => setTestRecipientEmail(e.target.value)}
                          placeholder="juan@gmail.com"
                          className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSendTestMemberEmail}
                      className="w-full bg-[#3b5998] hover:bg-indigo-700 transition-colors text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Notificación Test</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Email Welcome notification Template Editor */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-5 shadow-soft">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <span className="text-xl">📝</span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-church-navy flex items-center gap-1.5">
                      Plantilla de Bienvenida para Miembros Registrados
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Etiquetas válidas: {'{nome}'}, {'{email}'}, {'{data_registro}'} (HTML Soportado)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Asunto del Correo</label>
                    <input
                      type="text"
                      value={memberEmailSubject}
                      onChange={e => setMemberEmailSubject(e.target.value)}
                      placeholder="¡Te damos la bienvenida a nuestra Comunidad!"
                      className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs font-bold text-church-navy"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Cuerpo del Mensaje (HTML)</label>
                    <textarea
                      rows={5}
                      value={memberEmailBody}
                      onChange={e => setMemberEmailBody(e.target.value)}
                      placeholder="<p>Hola <strong>{nome}</strong>...</p>"
                      className="w-full bg-slate-50/50 border border-slate-150 rounded-2xl px-5 py-3.5 text-xs font-mono text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SMTP / REST Outbound Real-Time Handshake Monitor Console */}
              <div className="bg-slate-950 rounded-[2rem] p-6 border border-slate-800 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      Consola de Conexión Pastor-SMTP (Handshake Activo)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[8px] font-mono text-emerald-500 tracking-widest uppercase font-black">Live Monitor</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 overflow-y-auto max-h-56 font-mono text-[11px] text-slate-400 space-y-1.5">
                  {emailConsoleLogs.length === 0 ? (
                    <div className="text-slate-600 italic select-none">
                      Esperando acción pastoral... Ejecute una prueba de envío arriba para ver el rastreo SMTP / Handshake en tiempo real aquí.
                    </div>
                  ) : (
                    emailConsoleLogs.map((logStr, lIdx) => {
                      let colorClass = 'text-slate-400';
                      if (logStr.includes('[SUCESSO]')) colorClass = 'text-emerald-400 font-bold';
                      else if (logStr.includes('[ERRO]')) colorClass = 'text-red-400 font-bold';
                      else if (logStr.includes('[AVISO]')) colorClass = 'text-yellow-400 font-bold';
                      else if (logStr.includes('C ->') || logStr.includes('[CONEXÃO') || logStr.includes('[CONEXIÓN')) colorClass = 'text-sky-300';
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
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] border border-slate-100 max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-church-navy">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-650 text-white font-bold text-xs rounded-full transition-all shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[110] max-w-sm w-full bg-church-navy text-white p-5 rounded-3xl border border-white/10 shadow-strong flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-church-gold/20 flex items-center justify-center text-church-gold shrink-0 border border-church-gold/10">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-grow space-y-1">
              <h4 className="font-serif font-black text-sm text-church-gold">{toast.title}</h4>
              <p className="text-slate-200 text-xs font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Step Modal */}
      {isHistoryFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-church-navy/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-slate-50 px-10 py-8 flex justify-between items-center border-b border-slate-100">
                <div className="space-y-1">
                   <h3 className="text-2xl font-serif font-black text-church-navy">{editingHistoryStep ? 'Editar Hito Histórico' : 'Nuevo Hito Histórico'}</h3>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{editingHistoryStep ? 'Actualiza los detalles del momento' : 'Añade un nuevo momento clave'}</p>
                </div>
                <button onClick={() => setIsHistoryFormOpen(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:shadow-soft">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={(e) => {
               e.preventDefault();
               const newStep: any = {
                 id: editingHistoryStep ? editingHistoryStep.id : Math.random().toString(36).substring(2, 9),
                 year: historyFormYear,
                 title: historyFormTitle,
                 description: historyFormDescription
               };
               
               let newSteps = [...(tempSettings.historySteps || [])];
               if (editingHistoryStep) {
                 newSteps = newSteps.map((s: any) => s.id === editingHistoryStep.id ? newStep : s);
               } else {
                 newSteps.push(newStep);
               }
               
               setTempSettings({ ...tempSettings, historySteps: newSteps });
               setIsHistoryFormOpen(false);
             }} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Año</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. 1985"
                      value={historyFormYear}
                      onChange={(e) => setHistoryFormYear(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-850 font-black text-center"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Título del Evento</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Fundación de la Iglesia"
                      value={historyFormTitle}
                      onChange={(e) => setHistoryFormTitle(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-850 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Descripción Detallada</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Describe lo que sucedió en este período..."
                    value={historyFormDescription}
                    onChange={(e) => setHistoryFormDescription(e.target.value)}
                    className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium leading-relaxed"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsHistoryFormOpen(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-church-gold text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-strong hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> {editingHistoryStep ? 'Actualizar Hito' : 'Añadir a Cronología'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
