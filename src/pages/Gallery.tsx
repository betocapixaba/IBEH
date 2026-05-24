import { motion } from 'motion/react';
import { Camera, Film, Plus } from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryProps {
  items: GalleryItem[];
}

export default function Gallery({ items }: GalleryProps) {
  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-6">
      <div className="text-center mb-12 space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-2">
           <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Memorias Compartidas</span>
           <h1 className="text-4xl md:text-5xl font-serif font-black text-church-navy leading-tight">Momentos de Bendición</h1>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed font-medium">
          Un vistazo a la vibrante vida de nuestra iglesia a través de los años. Foto y video de nuestros encuentros más significativos.
        </p>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {items.length > 0 ? items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.8 }}
            viewport={{ once: true }}
            className="relative group rounded-[3rem] overflow-hidden bg-slate-100 break-inside-avoid shadow-soft hover:shadow-strong transition-all duration-700"
          >
            <img 
              src={item.url} 
              alt={item.title}
              className="w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-church-navy/90 via-church-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-10 text-white">
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                    {item.type === 'photo' ? <Camera className="w-4 h-4 text-church-gold" /> : <Film className="w-4 h-4 text-church-gold" />}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-300">{item.date}</span>
               </div>
               {item.eventName && (
                 <span className="inline-block text-[9px] bg-church-gold text-church-navy font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-4 w-fit">
                   Álbum: {item.eventName}
                 </span>
               )}
               <h4 className="text-2xl font-serif font-black leading-tight tracking-tight">{item.title}</h4>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-50 shadow-soft flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-300 italic font-serif text-2xl">La galería está esperando nuevos recuerdos...</p>
          </div>
        )}
      </div>
    </div>
  );
}
