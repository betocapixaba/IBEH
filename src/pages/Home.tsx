import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, ArrowRight, Church } from 'lucide-react';
import { Service, Event, ChurchSettings } from '../types';

interface HomeProps {
  services: Service[];
  featuredEvent?: Event;
  setActiveTab: (tab: string) => void;
  settings: ChurchSettings;
}

export default function Home({ services, featuredEvent, setActiveTab, settings }: HomeProps) {
  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section - Refined */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
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
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
               <div className="h-px w-8 bg-church-gold" />
               <span className="font-sans text-church-gold font-black tracking-[0.4em] uppercase text-[10px] sm:text-xs">
                 Nuestra Casa es Tu Casa
               </span>
               <div className="h-px w-8 bg-church-gold" />
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-black text-white leading-[1.1] tracking-tight">
              Donde la fe encuentra <br className="hidden md:block" />
              <span className="italic font-normal text-church-gold/90">una familia.</span>
            </h1>
            <p className="text-slate-200 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
              Ubicados en el corazón de Hartford, somos una comunidad dedicada a exaltar a Cristo y servir a nuestro prójimo con amor.
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
              className="group px-10 py-5 bg-church-gold text-church-navy font-black rounded-full hover:bg-white hover:scale-105 transition-all shadow-xl shadow-church-gold/20 flex items-center gap-3 uppercase text-xs tracking-widest"
            >
              Conócenos <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-all uppercase text-xs tracking-widest"
            >
              Ver Calendario
            </button>
          </motion.div>
        </div>

        {/* Floating Stat/Quick Link */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-12 text-church-navy font-sans text-[10px] uppercase tracking-[0.3em] font-black">
           <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-church-gold" /> Culto Dominical 10:00 AM</div>
           <div className="w-px h-4 bg-slate-200" />
           <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-church-gold" /> Hartford, CT</div>
        </div>
      </section>

      {/* Services Grid - Bento Style */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 md:p-16 shadow-soft border border-slate-100 flex flex-col justify-between">
            <div className="space-y-12">
              <div className="flex flex-col gap-2">
                 <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Agenda Semanal</span>
                 <h2 className="text-4xl md:text-5xl font-serif font-black text-church-navy">Nuestros Cultos</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.length > 0 ? services.map((service) => (
                  <div key={service.id} className="group p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-church-gold hover:bg-white transition-all duration-300">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-church-gold group-hover:text-white transition-colors duration-300">
                       <Clock className="w-5 h-5 text-church-gold group-hover:text-white" />
                    </div>
                    <p className="font-sans font-black text-church-navy uppercase tracking-widest text-[10px] mb-2">{service.day}</p>
                    <h4 className="text-2xl font-serif font-bold mb-3">{service.time}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{service.description}</p>
                  </div>
                )) : (
                  <div className="col-span-2 py-20 text-center">
                    <p className="text-slate-300 italic font-serif text-xl">Nuestros horarios se están actualizando...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-church-navy text-white rounded-[3rem] p-10 flex flex-col justify-between shadow-strong group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-church-gold/20 transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-church-gold" />
                </div>
                <h3 className="text-3xl font-serif font-black mb-6">Ubicación</h3>
                <p className="text-slate-300 text-base leading-relaxed font-medium">
                  {settings.address || '449 Park Street, Hartford - CT 06106'}
                </p>
                <div className="mt-8 space-y-4">
                  {settings.phone && (
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                       <div className="w-1 h-1 rounded-full bg-church-gold" /> {settings.phone}
                    </div>
                  )}
                  {settings.email && (
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                       <div className="w-1 h-1 rounded-full bg-church-gold" /> {settings.email}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  const query = encodeURIComponent(settings.address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
                className="relative z-10 w-full mt-12 py-4 bg-white text-church-navy font-black rounded-2xl hover:bg-church-gold hover:text-white transition-all uppercase text-[10px] tracking-widest"
              >
                Obtener Direcciones
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Event - More Modern */}
      {featuredEvent && (
        <section className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[4rem] overflow-hidden group shadow-strong">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-[400px] lg:h-auto overflow-hidden">
                <img 
                  src={featuredEvent.imageUrl} 
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="bg-white p-12 md:p-20 flex flex-col justify-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-church-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-3 bg-slate-50 text-church-navy px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border border-slate-100">
                    <Calendar className="w-4 h-4 text-church-gold" />
                    <span>{featuredEvent.date} {featuredEvent.time ? ` | ${featuredEvent.time}` : ''}</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-serif font-black text-church-navy leading-tight">
                    {featuredEvent.title}
                  </h3>
                  <p className="text-slate-500 text-lg leading-relaxed line-clamp-4">
                    {featuredEvent.description}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('events')}
                  className="relative z-10 px-10 py-5 bg-church-navy text-white font-black rounded-full w-fit hover:bg-church-gold transition-all self-start uppercase text-[10px] tracking-widest shadow-xl shadow-church-navy/10"
                >
                  Más Información
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Scripture Section - Centered Focus */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <div className="space-y-10 py-20 px-10 bg-white rounded-[4rem] border border-slate-100 shadow-soft">
          <div className="flex items-center justify-center text-church-gold opacity-30">
             <Church className="w-12 h-12" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-church-navy/90 leading-tight">
            "Porque yo sé muito bem os planos que tenho para vocês, planos de bem-estar..."
          </h2>
          <div className="space-y-2">
            <p className="font-sans font-black text-church-gold uppercase tracking-[0.5em] text-xs">Jeremías 29:11</p>
            <p className="text-slate-400 text-sm italic">Santas Escrituras</p>
          </div>
        </div>
      </section>
    </div>
  );
}
