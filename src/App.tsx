import { useState, useEffect } from 'react';
import { db, auth, loginWithGoogle, logout } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc, 
  query,
  limit 
} from 'firebase/firestore';
import { ChurchSettings, Service, Event, GalleryItem, QuickNotice } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Ministries from './pages/Ministries';
import Pastor from './pages/Pastor';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [settings, setSettings] = useState<ChurchSettings>({
    name: "Iglesia Bautista Emanuel Hartford",
    address: "449 Park Street, Hartford - CT 06106",
    phone: "(860) 555-0123",
    email: "info@emanuelhartford.org",
    mission: "Exaltar el nombre de Jesucristo y extender Su Reino a través de la predicación del evangelio a todas las naciones y el discipulado integral.",
    vision: "Ser una comunidad vibrante y transformadora que impacte Hartford con el poder del Espíritu Santo, restaurando vidas y familias.",
    values: [
      { label: 'Fe Bíblica', color: 'bg-church-gold' },
      { label: 'Amor Fraternal', color: 'bg-red-400' },
      { label: 'Excelencia en el Servicio', color: 'bg-church-navy' }
    ],
    historySteps: [
      { id: '1', year: '1985', title: 'Semilla de Fe', description: 'Nuestra iglesia nació de un pequeño grupo de oración en un hogar familiar, impulsado por un hambre inmensa de la presencia de Dios.' },
      { id: '2', year: '1992', title: 'Fundamentos Sólidos', description: 'Después de años de perseverancia, establecimos nuestra primera sede propia, convirtiéndonos en un punto de referencia espiritual para la ciudad.' },
      { id: '3', year: '2005', title: 'Nueva Generación', description: 'Lanzamos ministerios enfocados en la juventud con el objetivo de equipar a los líderes del mañana bajo los principios bíblicos.' },
      { id: '4', year: 'Hoy', title: 'Luz Continua', description: 'Seguimos creciendo y sirviendo a Hartford, extendiendo el amor de Cristo a través de misiones locales y mundiales.' }
    ],
    pastorName: "Rev. Juan Carlos Pérez",
    pastorImageUrl: "https://images.unsplash.com/photo-1544168190-79c17527004f?auto=format&fit=crop&q=80&w=800",
    pastorQuote: "Nuestra verdadera pasión es ver vidas transformadas radicalmente por el poder restaurador del Evangelio. En Emanuel no solo encontrarás una congregación, sino un hogar donde crecemos juntos en el amor de Cristo.",
    pastorBio: "El Reverendo Juan Carlos Pérez ha dedicado más de tres décadas al servicio del Reino de Dios, enfocándose en la enseñanza profunda de las Escrituras y el cuidado pastoral.\n\nSu ministerio se caracteriza por un compromiso inquebrantable con la Gran Comisión y la formación de discípulos que impacten positivamente su entorno. En Hartford, ha liderado durante diez años una visión de crecimiento espiritual genuino y alcance comunitario, creyendo firmemente que cada persona tiene un propósito divino esperando ser activado en el cuerpo de Cristo.",
    youtubeUrl: "https://youtube.com",
    facebookUrl: "https://www.facebook.com/IBEHARTFORD",
    welcomeTitle: "¡Bienvenidos!",
    welcomeMessage: "Qué alegría que estés aquí. Gracias por visitar nuestra casa online. Oramos para que este espacio sea de gran bendición y edificación para tu vida.",
    heroBadge: "Nuestra Casa es Tu Casa",
    heroTitle: "Donde la fe encuentra",
    heroTitleHighlight: "una familia.",
    heroSubtitle: "Ubicados en el corazón de Hartford, somos una comunidad dedicada a exaltar a Cristo y servir a nuestro prójimo con amor."
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [quickNotices, setQuickNotices] = useState<QuickNotice[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // Listeners
    const settingsRef = doc(db, 'settings', 'main');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings(prev => ({ 
          ...prev, 
          ...data,
          // Ensure arrays and nested objects are properly merged or at least preserved if missing in data
          historySteps: data.historySteps || prev.historySteps,
          values: data.values || prev.values
        }));
      } else {
        // Init default settings if not exists
        setDoc(settingsRef, settings);
      }
    });

    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      setServices(data.sort((a, b) => a.day.localeCompare(b.day)));
      
      // Seed if empty for demo
      if (snap.empty) {
        setDoc(doc(collection(db, 'services')), { day: 'Domingo', time: '10:00 AM', description: 'Culto Principal de Adoración' });
        setDoc(doc(collection(db, 'services')), { day: 'Miércoles', time: '7:00 PM', description: 'Estudio Bíblico y Oración' });
      }
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Event));
      setEvents(data);
      
      // Auto-Cleanup: Delete events 2 hours after start time
      const now = new Date();
      data.forEach(async (event) => {
        if (!event.date) return;
        try {
          // Attempt to parse date and time safely
          // ISO format (YYYY-MM-DD) + T + HH:mm
          const eventStart = new Date(`${event.date}T${event.time || '00:00'}:00`);
          if (isNaN(eventStart.getTime())) return; // Skip if invalid date

          const expiryTime = new Date(eventStart.getTime() + (2 * 60 * 60 * 1000));
          if (now > expiryTime) {
            await deleteDoc(doc(db, 'events', event.id));
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      });
      
      if (snap.empty) {
        setDoc(doc(collection(db, 'events')), { 
          title: 'Congreso de Mujeres 2024', 
          date: '15 de Junto, 2024', 
          imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200', 
          description: 'Un tiempo de renovación y empoderamiento para todas las mujeres de nuestra comunidad.',
          isFeatured: true 
        });
      }
    });

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem));
      setGallery(data);
      
      if (snap.empty) {
        setDoc(doc(collection(db, 'gallery')), { 
          title: 'Retiro de Jóvenes', 
          date: 'Mayo 2024', 
          url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800', 
          type: 'photo' 
        });
      }
    });

    const unsubNotices = onSnapshot(collection(db, 'quick_notices'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuickNotice));
      setQuickNotices(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    return () => {
      unsubAuth();
      unsubSettings();
      unsubServices();
      unsubEvents();
      unsubGallery();
      unsubNotices();
    };
  }, []);

  const handleAdminToggle = () => {
    setIsAdminMode(!isAdminMode);
  };

  const featuredEvent = events.find(e => e.isFeatured) || events[0];

  return (
    <div className="min-h-screen bg-[#F1EFD9]/60 flex flex-col font-sans selection:bg-church-gold/30">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(id) => { setActiveTab(id); setIsAdminMode(false); }} 
        isAdmin={isAdminMode} 
        onAdminToggle={handleAdminToggle}
        settings={settings}
      />

      <main className="flex-grow">
        {isAdminMode ? (
          <AdminDashboard 
            settings={settings} 
            services={services} 
            events={events} 
            gallery={gallery}
            quickNotices={quickNotices}
            onRefresh={() => {}} // Snapshot handles this
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <Home 
                services={services} 
                events={events} 
                quickNotices={quickNotices}
                setActiveTab={setActiveTab} 
                settings={settings}
              />
            )}
            {(activeTab === 'history' || activeTab === 'about') && (
              <About activeSection={activeTab as any} settings={settings} />
            )}
            {activeTab === 'ministries' && <Ministries />}
            {activeTab === 'pastor' && <Pastor settings={settings} />}
            {activeTab === 'events' && <Events events={events} />}
            {activeTab === 'gallery' && <Gallery items={gallery} />}
          </>
        )}
      </main>

      <Footer settings={settings} services={services} />
    </div>
  );
}
