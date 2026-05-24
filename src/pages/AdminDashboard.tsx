import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  deleteDoc, 
  doc, 
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { ChurchSettings, Service, Event, GalleryItem, AdminAccount, HistoryStep } from '../types';
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
  Sparkles,
  CheckCircle,
  Home as HomeIcon,
  HelpCircle,
  LogOut,
  ShieldAlert,
  Pencil,
  MapPin,
  X,
  History
} from 'lucide-react';

interface AdminDashboardProps {
  settings: ChurchSettings;
  services: Service[];
  events: Event[];
  gallery: GalleryItem[];
  onRefresh: () => void;
}

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

export default function AdminDashboard({ settings, services, events, gallery, onRefresh }: AdminDashboardProps) {
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
  const [activePanel, setActivePanel] = useState<'settings' | 'history' | 'services' | 'events' | 'gallery' | 'users'>('settings');

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
        setDoc(doc(db, 'admin_accounts', 'admin'), defaultAdmin);
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedId = userId.trim().toLowerCase();
    const found = adminUsers.find(u => u.id.toLowerCase() === trimmedId);

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
      '¿Está seguro de que desea eliminar este evento de forma permanente? No se podrá recuperar.',
      async () => {
        await deleteDoc(doc(db, 'events', id));
        onRefresh();
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

    setGalleryFormUrl(item.url);
    setGalleryFormUrls([item.url]);
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

  const saveGalleryForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedUser?.permissions.gallery) return;

    let finalUrls = [...galleryFormUrls];
    if (galleryFormUrl && !finalUrls.includes(galleryFormUrl)) {
      finalUrls.push(galleryFormUrl);
    }

    finalUrls = finalUrls.filter(url => url.trim() !== '');

    const computedDate = galleryFormDay.trim()
      ? `${galleryFormDay.trim()} de ${galleryFormMonth}, ${galleryFormYear}`
      : `${galleryFormMonth} ${galleryFormYear}`;

    if (!galleryFormTitle || !computedDate || finalUrls.length === 0) {
      alert('El título, la fecha y al menos una imagen son requeridos.');
      return;
    }

    try {
      if (editingGalleryItem) {
        // Edit single item
        await setDoc(doc(db, 'gallery', editingGalleryItem.id), {
          title: galleryFormTitle,
          eventName: galleryFormEventName,
          date: computedDate,
          url: finalUrls[0],
          type: galleryFormType
        });
      } else {
        // Create multiple items with the exact same details
        for (const url of finalUrls) {
          const id = Math.random().toString(36).substring(2, 9);
          await setDoc(doc(db, 'gallery', id), {
            title: galleryFormTitle,
            eventName: galleryFormEventName,
            date: computedDate,
            url: url,
            type: galleryFormType
          });
        }
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
            { id: 'history', name: 'Historia', icon: History, allowed: loggedUser.permissions.settings },
            { id: 'services', name: 'Horarios de Culto', icon: Clock, allowed: loggedUser.permissions.services },
            { id: 'events', name: 'Eventos y Actividades', icon: Calendar, allowed: loggedUser.permissions.events },
            { id: 'gallery', name: 'Galería de Memorias', icon: Camera, allowed: loggedUser.permissions.gallery },
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Teléfono de la Oficina</label>
                      <input 
                        type="text" 
                        value={tempSettings.phone}
                        onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Misión de la Iglesia</label>
                       <textarea 
                         rows={4}
                         placeholder="Describa el propósito fundamental de la iglesia..."
                         value={tempSettings.mission}
                         onChange={(e) => setTempSettings({ ...tempSettings, mission: e.target.value })}
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Visión de la Iglesia</label>
                       <textarea 
                         rows={4}
                         placeholder="¿Hacia dónde se dirige la iglesia en los próximos años?"
                         value={tempSettings.vision}
                         onChange={(e) => setTempSettings({ ...tempSettings, vision: e.target.value })}
                         className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                       />
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

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">URL de la Imagen</label>
                      <input 
                        type="text" 
                        placeholder="Deja en blanco para imagen por defecto"
                        value={eventFormImageUrl}
                        onChange={(e) => setEventFormImageUrl(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fecha (Día del Evento)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Sábado 12 de Junio"
                        value={eventFormDate}
                        onChange={(e) => setEventFormDate(e.target.value)}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Horario de Inicio</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 7:00 PM o 19:30"
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
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Descripción del Evento</label>
                      <textarea 
                        rows={3}
                        placeholder="Escriba los detalles o pasajes del evento..."
                        value={eventFormDescription}
                        onChange={(e) => setEventFormDescription(e.target.value)}
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium"
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
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fecha del Recuerdo (Día, Mes y Año)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold">Día</span>
                          <input 
                            type="text" 
                            placeholder="Ej. 15 (Opcional)"
                            maxLength={2}
                            value={galleryFormDay}
                            onChange={(e) => setGalleryFormDay(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium font-sans text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold">Mes del Año</span>
                          <select 
                            value={galleryFormMonth}
                            onChange={(e) => setGalleryFormMonth(e.target.value)}
                            className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-bold font-sans text-xs"
                          >
                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold">Año</span>
                          <input 
                            type="number" 
                            placeholder="Año"
                            value={galleryFormYear}
                            onChange={(e) => setGalleryFormYear(e.target.value)}
                            className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-church-gold/20 text-slate-800 font-medium font-sans text-xs"
                          />
                        </div>
                      </div>
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
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              Fotos a Registrar ({galleryFormUrls.length || (galleryFormUrl ? 1 : 0)})
                            </p>
                            {galleryFormUrls.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setGalleryFormUrls([])}
                                className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase"
                              >
                                Limpiar Todas
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {galleryFormUrls.map((url, index) => (
                              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                                <img src={url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGalleryFormUrls(prev => prev.filter((_, i) => i !== index));
                                    if (galleryFormUrl === url) {
                                      setGalleryFormUrl('');
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow-md transition-colors"
                                  title="Remover"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {galleryFormUrl && !galleryFormUrls.includes(galleryFormUrl) && (
                              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group ring-2 ring-church-gold/30">
                                <img src={galleryFormUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] text-white font-bold pointer-events-none">
                                  Por Añadir
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGalleryFormUrl('')}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow-md transition-colors"
                                  title="Remover"
                                >
                                  <X className="w-3 h-3" />
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
