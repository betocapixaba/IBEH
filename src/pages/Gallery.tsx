import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Film, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MessageCircle, 
  Send 
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
  deleteDoc
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
      className="cursor-pointer relative overflow-hidden aspect-[4/3] w-full group/collage"
    >
      <img 
        src={displayUrl} 
        alt={title}
        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/collage:scale-110"
        referrerPolicy="no-referrer"
      />
      {/* Absolute overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover/collage:bg-black/50 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover/collage:opacity-100 transform translate-y-3 group-hover/collage:translate-y-0 text-white font-serif flex flex-col items-center gap-1.5 transition-all duration-300">
          <span className="p-2.5 bg-white/20 rounded-full backdrop-blur-sm shadow">
            <Camera className="w-5 h-5 text-white" />
          </span>
          <span className="text-xs uppercase tracking-widest font-black">
            Ver Álbum
          </span>
          {count > 1 && (
            <span className="text-[10px] text-[#cf9d34] font-black bg-white px-2.5 py-0.5 rounded-full uppercase tracking-wider scale-95 shadow">
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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'registered_users', u.uid));
          if (userDoc.exists()) {
            setRegisteredUser(userDoc.data());
          } else {
            // Auto-register google users
            if (u.displayName && u.email) {
              const profile = {
                name: u.displayName,
                email: u.email,
                role: 'member',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'registered_users', u.uid), profile);
              setRegisteredUser(profile);
            } else {
              setRegisteredUser(null);
            }
          }
        } catch (err) {
          console.error("Error reading registered user doc:", err);
        }
      } else {
        setRegisteredUser(null);
      }
    });
    return () => unsub();
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
        {items.length > 0 ? items.map((item, idx) => {
          const itemPhotos = item.urls && item.urls.length > 0 ? item.urls : [item.url];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group rounded-[3rem] overflow-hidden bg-white border border-slate-100 break-inside-avoid shadow-soft hover:shadow-strong transition-all duration-500 flex flex-col"
            >
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
