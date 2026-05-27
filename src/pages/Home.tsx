import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, ArrowRight, Church, Sparkles, Bell, HeartHandshake, Send, Check } from 'lucide-react';
import { Service, Event, ChurchSettings, QuickNotice } from '../types';
import churchMapImg from '../assets/images/church_map_1779745801080.png';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface HomeProps {
  services: Service[];
  events: Event[];
  quickNotices: QuickNotice[];
  setActiveTab: (tab: string) => void;
  settings: ChurchSettings;
}

export default function Home({ services, events, quickNotices, setActiveTab, settings }: HomeProps) {
  const [prayerName, setPrayerName] = useState('');
  const [prayerPhone, setPrayerPhone] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handlePrayerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prayerName.trim() || !prayerRequest.trim()) {
      setSubmitError('Por favor, rellene todos los campos obligatorios (*).');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await addDoc(collection(db, 'prayer_requests'), {
        name: prayerName.trim(),
        phone: prayerPhone.trim(),
        request: prayerRequest.trim(),
        createdAt: new Date().toISOString()
      });
      
      setSubmitSuccess(true);
      setPrayerName('');
      setPrayerPhone('');
      setPrayerRequest('');
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      setSubmitError('Hubo un error al enviar su pedido. Inténtelo de nuevo.');
      try {
        handleFirestoreError(error, OperationType.CREATE, 'prayer_requests');
      } catch (formattedError) {
        // Log original formatted JSON string
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section - Refined */}
      <section className="relative min-h-[65vh] flex items-center justify-center pt-24 sm:pt-32 py-12">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={settings.heroUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000"} 
            alt="Hero Background"
            className="w-full h-full object-cover scale-105 transition-transform duration-[10s] ease-linear hover:scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-church-navy/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-church-navy/20 via-transparent to-slate-50" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 translate-y-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-4 mb-2">
               <div className="h-px w-8 bg-church-gold" />
               <span className="font-sans text-church-gold font-black tracking-[0.4em] uppercase text-[10px] sm:text-xs">
                 {settings.heroBadge || 'Nuestra Casa es Tu Casa'}
               </span>
               <div className="h-px w-8 bg-church-gold" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-black text-white leading-[1.1] tracking-tight">
              {settings.heroTitle || 'Donde la fe encuentra'} <br className="hidden md:block" />
              <span className="italic font-normal text-church-gold/90">{settings.heroTitleHighlight || 'una familia.'}</span>
            </h1>
            <p className="text-slate-200 text-base sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
              {settings.heroSubtitle || 'Ubicados en el corazón de Hartford, somos una comunidad dedicada a exaltar a Cristo y servir a nuestro prójimo con amor.'}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={() => setActiveTab('about')}
              className="group px-8 py-4 bg-church-gold text-church-navy font-black rounded-full hover:bg-white hover:scale-105 transition-all shadow-xl shadow-church-gold/20 flex items-center gap-3 uppercase text-[10px] tracking-widest"
            >
              Conócenos <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-all uppercase text-[10px] tracking-widest"
            >
              Ver Calendario
            </button>
          </motion.div>

          {/* Floating Stat/Quick Link - Redesigned & Moved below buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            style={{ color: '#2e416c' }}
            className="flex items-center justify-center gap-3 font-sans text-[10px] uppercase tracking-[0.3em] font-black bg-white/5 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 w-fit mx-auto hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg cursor-default"
          >
            <Clock className="w-4 h-4 text-church-gold" /> Culto Dominical 10:00 AM
          </motion.div>
        </div>
      </section>

      {/* Quick Notices - Last-Minute Announcements */}
      {quickNotices && quickNotices.length > 0 && (
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left mb-6">
            <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-1.5 justify-center md:justify-start">
              <Bell className="w-3.5 h-3.5 animate-bounce text-church-gold" /> Comunicados Último Minuto
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-church-navy">Avisos Especiales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {quickNotices.map((notice, index) => (
              <div 
                key={notice.id} 
                className={`${notice.widthClass || 'col-span-12'} ${notice.bgColor || 'bg-white'} ${notice.heightClass || 'p-5 min-h-[160px]'} rounded-[2rem] shadow-soft border border-slate-100 flex flex-col justify-between transition-all hover:scale-[1.01] duration-300 relative overflow-hidden`}
              >
                {/* Decorative background accent for styling */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-2.5 relative z-10">
                  <h3 className={`text-lg md:text-xl font-serif font-black ${notice.titleColor || 'text-church-navy'}`}>
                    {notice.title}
                  </h3>
                  <p className={`text-xs md:text-sm ${notice.contentColor || 'text-slate-600'} whitespace-pre-line leading-relaxed font-medium`}>
                    {notice.content}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-[8px] font-mono tracking-wider uppercase opacity-50 relative z-10">
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services Grid - Bento Style */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white rounded-[2rem] p-5 md:p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col gap-0.5">
                 <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Agenda Semanal</span>
                 <h2 className="text-2xl md:text-3xl font-serif font-black text-church-navy">Nuestros Cultos</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.length > 0 ? services.map((service) => (
                  <div key={service.id} className="group p-4 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 hover:border-church-gold hover:bg-white transition-all duration-300">
                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2 group-hover:bg-church-gold group-hover:text-white transition-colors duration-300">
                       <Clock className="w-4 h-4 text-church-gold group-hover:text-white" />
                    </div>
                    <p className="font-sans font-black text-church-navy uppercase tracking-widest text-[9px] mb-0.5">{service.day}</p>
                    <h4 className="text-base font-serif font-bold mb-0.5">{service.time}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{service.description}</p>
                  </div>
                )) : (
                  <div className="col-span-2 py-8 text-center">
                    <p className="text-slate-300 italic font-serif text-lg">Nuestros horarios se están actualizando...</p>
                  </div>
                )}
              </div>

              {/* Facebook Live Callout Infobox */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-church-gold font-black uppercase tracking-widest text-[9px]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-church-gold/60 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-church-gold"></span>
                    </span>
                    Servicio Dominical
                  </div>
                  <p className="text-xs md:text-sm text-church-navy/80 font-bold leading-relaxed">
                    Acompañe nuestro servicio dominical en Facebook Live. Comienza a las 11:15 de la mañana.
                  </p>
                </div>
                <a 
                  href="https://www.facebook.com/IBEHARTFORD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-church-navy hover:bg-church-navy/90 text-white text-[10px] uppercase tracking-widest font-black rounded-xl whitespace-nowrap self-start md:self-auto text-center shadow-sm transition-all duration-300 hover:scale-105 active:scale-98 cursor-pointer"
                >
                  ¡Usted es nuestro invitado!
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-church-navy text-white rounded-[2rem] p-5 flex flex-col justify-between shadow-strong group overflow-hidden relative h-full min-h-[310px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-church-gold/20 transition-all" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/10 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-church-gold" />
                  </div>
                  <h3 style={{ color: '#dca300' }} className="text-lg font-serif font-black mb-1">{settings.welcomeTitle || '¡Bienvenidos!'}</h3>
                  <p className="text-slate-200 text-xs leading-relaxed font-medium italic">
                    "{settings.welcomeMessage || 'Qué alegría que estés aquí. Gracias por visitar nuestra casa online. Oramos para que este espacio sea de gran bendición y edificación para tu vida.'}"
                  </p>
                </div>

                {/* Map/Location section inside the rectangle */}
                <div className="space-y-2">
                  <a 
                    href="https://www.google.com/maps/place/449+Washington+St,+Hartford,+CT+06106/@41.7479331,-72.6833788,17z/data=!4m6!3m5!1s0x89e653165a974109:0xb463cf67b1ef8efe!8m2!3d41.7479016!4d-72.6837422!16s%2Fg%2F11yhpl1j4c?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[2.3/1] w-full group/map hover:scale-[1.02] active:scale-[0.99] transition-transform duration-300"
                    title="Ver en Google Maps"
                  >
                    <img 
                      src={churchMapImg} 
                      alt="Ubicación de la Iglesia Emanuel Hartford" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/map:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-2">
                      <div className="flex items-center gap-1.5 text-white">
                        <MapPin className="w-3.5 h-3.5 text-church-gold shrink-0 animate-bounce" />
                        <span className="text-[10px] font-bold tracking-wide truncate max-w-[200px]">
                          449 Washington St, Hartford, CT
                        </span>
                      </div>
                    </div>
                  </a>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-church-gold font-black uppercase tracking-[0.2em] text-[8px]">Emanuel Hartford</span>
                    <a 
                      href="https://www.google.com/maps/place/449+Washington+St,+Hartford,+CT+06106/@41.7479331,-72.6833788,17z/data=!4m6!3m5!1s0x89e653165a974109:0xb463cf67b1ef8efe!8m2!3d41.7479016!4d-72.6837422!16s%2Fg%2F11yhpl1j4c?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                    >
                      Cómo Llegar <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events - More Modern */}
      {events && events.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="flex flex-col gap-0.5 text-center md:text-left">
             <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Próximas Actividades</span>
             <h2 className="text-2xl md:text-3xl font-serif font-black text-church-navy">Eventos Especiales</h2>
          </div>
          <div className="space-y-5">
            {events.map((event) => (
              <div key={event.id} className="relative rounded-[1.75rem] overflow-hidden group shadow-soft border border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="h-[180px] lg:h-auto lg:min-h-[220px] overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="bg-white p-5 md:p-6 flex flex-col justify-center space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-church-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="space-y-1.5 relative z-10">
                      <div className="inline-flex items-center gap-2 bg-slate-50 text-church-navy px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border border-slate-100">
                        <Calendar className="w-3 h-3 text-church-gold" />
                        <span>{event.date} {event.time ? ` | ${event.time}` : ''}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-serif font-black text-church-navy leading-tight">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('events')}
                      className="relative z-10 px-5 py-2.5 bg-church-navy text-white font-black rounded-full w-fit hover:bg-church-gold transition-all self-start uppercase text-[8px] tracking-widest shadow-lg shadow-church-navy/5"
                    >
                      Más Información
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scripture Section - Centered Focus */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <div className="space-y-4 py-8 px-6 bg-white rounded-[2rem] border border-slate-100 shadow-soft">
          <div className="flex items-center justify-center text-church-gold opacity-30">
             <Church className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-3xl font-serif font-bold italic text-church-navy/90 leading-tight">
            "Porque yo sé muito bem os planos que tenho para vocês, planos de bem-estar..."
          </h2>
          <div className="space-y-0.5">
            <p className="font-sans font-black text-church-gold uppercase tracking-[0.5em] text-[10px]">Jeremías 29:11</p>
            <p className="text-slate-400 text-xs italic">Santas Escrituras</p>
          </div>
        </div>
      </section>

      {/* Seção de Pedido de Oração (Prayer Requests) */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-church-gold/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-church-navy/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3 mb-8">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
              <HeartHandshake className="w-6 h-6 text-church-gold" />
            </div>
            <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">¿Podemos Orar por Ti?</span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-church-navy">Pedidos de Oración</h2>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              Comparte con nosotros tus peticiones de oración. Nuestro equipo de intercesores y pastores estarán clamando al Señor por tu vida, tu familia y tus necesidades.
            </p>
          </div>

          <form onSubmit={handlePrayerSubmit} className="relative z-10 max-w-xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-church-navy uppercase tracking-wider">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={prayerName}
                  onChange={(e) => setPrayerName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-church-navy font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-church-gold/20 focus:border-church-gold focus:bg-white transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-church-navy uppercase tracking-wider">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="(000) 000-0000"
                  value={prayerPhone}
                  onChange={(e) => setPrayerPhone(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-church-navy font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-church-gold/20 focus:border-church-gold focus:bg-white transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-church-navy uppercase tracking-wider">
                Motivo/Pedido de Oración <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Escribe aquí tu petición o mensaje para oración..."
                value={prayerRequest}
                onChange={(e) => setPrayerRequest(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-church-navy font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-church-gold/20 focus:border-church-gold focus:bg-white transition-all duration-300 resize-none"
                disabled={isSubmitting}
              />
            </div>

            {submitError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold text-center"
              >
                {submitError}
              </motion.div>
            )}

            {submitSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Petición de oración enviada con éxito! Estaremos intercediendo por ti de inmediato.</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-church-navy text-white hover:bg-church-gold text-[10px] font-black tracking-[0.2em] uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-church-navy/10 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Transmitiendo clamor...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Motivo de Oración</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
