import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import { ChurchSettings } from '../types';
import { LanguageCode, translateText } from '../lib/translations';

interface PastorProps {
  settings: ChurchSettings;
  currentLang?: LanguageCode;
}

export default function Pastor({ settings, currentLang = 'es' }: PastorProps) {
  const pastorBioText = settings.pastorBio || "El Reverendo Juan Carlos Pérez ha dedicado más de tres décadas al servicio del Reino de Dios, enfocándose en la enseñanza profunda de las Escrituras y el cuidado pastoral.\n\nSu ministerio se caracteriza por un compromiso inquebrantable con la Gran Comisión y la formación de discípulos que impacten positivamente su entorno. En Hartford, ha liderado durante diez años una visión de crecimiento espiritual genuino y alcance comunitario, creyendo firmemente que cada persona tiene un propósito divino esperando ser activado en el cuerpo de Cristo.";

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative group"
        >
          <div className="relative aspect-[4/5] rounded-[4rem] overflow-hidden bg-slate-100 shadow-strong z-10 transition-transform duration-700 group-hover:scale-[1.02]">
            <img 
              src={settings.pastorImageUrl || "https://images.unsplash.com/photo-1544168190-79c17527004f?auto=format&fit=crop&q=80&w=800"} 
              alt={translateText('Pastor Principal', currentLang)}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-church-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
          
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-church-gold rounded-full -z-0 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8 relative group"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="h-px w-6 bg-church-gold" />
               <span className="text-church-gold font-black capitalize tracking-widest text-[10px]">
                 {translateText('Liderazgo Espiritual', currentLang)}
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-church-navy leading-tight">
              {translateText('Pastor', currentLang)} <br />
              <span className="text-church-gold italic font-normal underline decoration-slate-100 underline-offset-8">
                {translateText('Principal', currentLang)}
              </span>
            </h1>
            <p className="text-xl font-serif text-slate-400">
              {translateText(settings.pastorName || 'Rev. Juan Carlos Pérez', currentLang)}
            </p>
          </div>

          <div className="relative p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-soft italic text-lg text-slate-600 leading-relaxed group">
            <Quote className="absolute -top-4 -left-4 w-12 h-12 text-church-gold/10 group-hover:text-church-gold/20 transition-colors" />
            <p className="relative z-10 whitespace-pre-wrap">
              "{translateText(settings.pastorQuote || "Nuestra verdadera pasión es ver vidas transformadas radicalmente por el poder restaurador del Evangelio. En Emanuel no solo encontrarás una congregación, sino un hogar donde crecemos juntos en el amor de Cristo.", currentLang)}"
            </p>
          </div>

          <div className="space-y-6 text-slate-500 text-base leading-relaxed font-medium whitespace-pre-wrap">
            {translateText(pastorBioText, currentLang).split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-serif font-bold text-church-navy text-xl">
                {translateText('Mensaje Semanal', currentLang)}
              </h4>
              <p className="text-sm text-slate-400 mt-1 font-medium italic">
                {translateText('Disponible en YouTube & Redes Sociales', currentLang)}
              </p>
            </div>
            <button 
              onClick={() => {
                const url = settings.facebookUrl || settings.youtubeUrl || 'https://www.facebook.com/IBEHARTFORD';
                window.open(url, '_blank');
              }}
              className="px-8 py-4 bg-slate-50 text-church-navy font-black rounded-full hover:bg-church-navy hover:text-white transition-all uppercase text-[10px] tracking-widest border border-slate-100 active:scale-95"
            >
               {translateText('Ver Predicaciones', currentLang)}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
