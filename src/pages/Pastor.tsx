import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

export default function Pastor() {
  return (
    <div className="pt-48 pb-32 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative group"
        >
          <div className="relative aspect-[4/5] rounded-[4rem] overflow-hidden bg-slate-100 shadow-strong z-10 transition-transform duration-700 group-hover:scale-[1.02]">
            <img 
              src="https://images.unsplash.com/photo-1544168190-79c17527004f?auto=format&fit=crop&q=80&w=800" 
              alt="Pastor Principal"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-church-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
          
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-church-gold rounded-full -z-0 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
          
          <div className="absolute -top-12 -right-12 hidden lg:block">
             <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-50 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                <p className="text-church-gold font-black uppercase tracking-widest text-[10px]">Vocación</p>
                <p className="text-church-navy font-serif font-bold text-xl leading-tight mt-1">30+ Años de <br /> Servicio</p>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-px w-6 bg-church-gold" />
               <span className="text-church-gold font-black capitalize tracking-widest text-xs">Liderazgo Espiritual</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-church-navy leading-tight">Pastor <br /><span className="text-church-gold italic font-normal underline decoration-slate-100 underline-offset-8">Principal</span></h1>
            <p className="text-2xl font-serif text-slate-400">Rev. Juan Carlos Pérez</p>
          </div>

          <div className="relative p-12 bg-white rounded-[3rem] border border-slate-50 shadow-soft italic text-xl text-slate-600 leading-relaxed group">
            <Quote className="absolute -top-6 -left-6 w-16 h-16 text-church-gold/10 group-hover:text-church-gold/20 transition-colors" />
            <p className="relative z-10">
              "Nuestra verdadera pasión es ver vidas transformadas radicalmente por el poder restaurador del Evangelio. En Emanuel no solo encontrarás una congregación, sino un hogar donde crecemos juntos en el amor de Cristo."
            </p>
          </div>

          <div className="space-y-8 text-slate-500 text-lg leading-relaxed font-medium">
            <p>
              El Reverendo Juan Carlos Pérez ha dedicado más de tres décadas al servicio del Reino de Dios, enfocándose en la enseñanza profunda de las Escrituras y el cuidado pastoral. Su ministerio se caracteriza por un compromiso inquebrantable con la Gran Comisión y la formación de discípulos que impacten positivamente su entorno.
            </p>
            <p>
              En Hartford, ha liderado durante diez años una visión de crecimiento espiritual genuino y alcance comunitario, creyendo firmemente que cada persona tiene un propósito divino esperando ser activado en el cuerpo de Cristo.
            </p>
          </div>
          
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-serif font-bold text-church-navy text-xl">Mensaje Semanal</h4>
              <p className="text-sm text-slate-400 mt-1 font-medium italic">
                Disponible en YouTube & Redes Sociales
              </p>
            </div>
            <button className="px-8 py-4 bg-slate-50 text-church-navy font-black rounded-full hover:bg-church-navy hover:text-white transition-all uppercase text-[10px] tracking-widest border border-slate-100">
               Ver Predicaciones
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
