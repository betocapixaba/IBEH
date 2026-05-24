import { motion } from 'motion/react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Event } from '../types';

interface EventsProps {
  events: Event[];
}

export default function Events({ events }: EventsProps) {
  return (
    <div className="pt-40 pb-32 max-w-7xl mx-auto px-6">
      <div className="text-center mb-24 space-y-8 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-4">
           <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Calendario de Actividades</span>
           <h1 className="text-5xl md:text-7xl font-serif font-black text-church-navy leading-tight">Próximos Eventos</h1>
        </div>
        <p className="text-slate-500 text-xl leading-relaxed font-medium">
          Mantente al tanto de todas nuestras actividades especiales, conferencias y reuniones grupales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {events.length > 0 ? events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="group relative flex flex-col bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-soft hover:shadow-strong transition-all duration-500"
          >
            <div className="relative h-72 overflow-hidden">
               <img 
                 src={event.imageUrl} 
                 alt={event.title}
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-church-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               
               <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl flex flex-col items-center border border-white shadow-soft">
                  <span className="text-[10px] uppercase font-black text-church-gold tracking-widest leading-none mb-1">PROX</span>
                  <span className="text-2xl font-serif font-black text-church-navy leading-none">24</span>
               </div>
            </div>
            
            <div className="p-10 flex-grow flex flex-col space-y-6">
              <div className="space-y-4">
                <h3 className="text-3xl font-serif font-bold text-church-navy leading-tight group-hover:text-church-gold transition-colors">{event.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed font-medium line-clamp-3">
                  {event.description}
                </p>
              </div>
              
              <div className="pt-8 border-t border-slate-50 space-y-4 mt-auto">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 tracking-wide">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-church-gold" />
                  </div>
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 tracking-wide">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-church-gold" />
                  </div>
                  <span>{event.time || '19:00'}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 tracking-wide">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-church-gold" />
                  </div>
                  <span>{event.location || 'Santuario Principal'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-50 shadow-soft">
            <p className="text-slate-300 italic font-serif text-2xl">No hay eventos programados en este momento...</p>
          </div>
        )}
      </div>
    </div>
  );
}
