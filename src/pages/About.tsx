import { motion } from 'motion/react';
import { History, Users, Target, Heart } from 'lucide-react';
import { ChurchSettings } from '../types';

interface AboutProps {
  activeSection: 'history' | 'about';
  settings: ChurchSettings;
}

export default function About({ activeSection, settings }: AboutProps) {
  const isHistory = activeSection === 'history';

  const historySteps = [...(settings.historySteps || [])].sort((a, b) => a.year.localeCompare(b.year));
  const mission = settings.mission || "Exaltar el nombre de Jesucristo y extender Su Reino a través de la predicación del evangelio a todas las naciones y el discipulado integral.";
  const vision = settings.vision || "Ser una comunidad vibrante y transformadora que impacte Hartford con el poder del Espíritu Santo, restaurando vidas y familias.";
  const values = settings.values || [
    { label: 'Fe Bíblica', color: 'bg-church-gold' },
    { label: 'Amor Fraternal', color: 'bg-red-400' },
    { label: 'Excelencia en el Servicio', color: 'bg-church-navy' }
  ];

  return (
    <div className="pt-40 pb-32 max-w-7xl mx-auto px-6">
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-32"
      >
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col items-center gap-4">
             <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Identidad y Raíces</span>
             <h1 className="text-5xl md:text-7xl font-serif font-black text-church-navy leading-tight">
               {isHistory ? 'Nuestra Historia' : 'Quiénes Somos'}
             </h1>
          </div>
          <p className="text-slate-500 text-xl leading-relaxed font-medium">
            {isHistory 
              ? 'Un recorrido de fe inquebrantable que ha transformado generaciones en el corazón de Hartford.' 
              : 'Conoce nuestra visión, misión y los valores cristianos que guían cada paso de nuestra comunidad.'}
          </p>
        </div>

        {isHistory ? (
          <div className="relative max-w-5xl mx-auto">
             <div className="absolute left-1/2 -translate-x-1/2 w-px h-full bg-slate-100 hidden md:block"></div>
             
             <div className="space-y-24 relative">
                {historySteps.map((step, idx) => (
                  <div key={step.id} className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                    <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                       <span className="text-6xl font-serif font-black text-slate-100 group-hover:text-church-gold/20 transition-colors">{step.year}</span>
                       <div className="space-y-4">
                         <h3 className="text-3xl font-serif font-bold text-church-navy">{step.title}</h3>
                         <p className="text-slate-500 text-base leading-relaxed font-medium">{step.description}</p>
                       </div>
                    </div>
                    <div className="hidden md:flex w-14 h-14 rounded-full bg-white border border-slate-100 shadow-soft z-10 items-center justify-center text-church-gold transition-transform hover:scale-110">
                      <History className="w-5 h-5" />
                    </div>
                    <div className="hidden md:block w-1/2"></div>
                  </div>
                ))}
                {historySteps.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-slate-300 italic font-serif text-2xl">La historia se está escribiendo...</p>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-soft transition-all hover:shadow-strong group">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-church-gold transition-colors duration-500 overflow-hidden relative">
                <protein-lucide-users className="w-8 h-8 text-church-gold group-hover:text-white transition-colors duration-500 relative z-10" />
                <Users className="w-8 h-8 text-church-gold group-hover:text-white transition-colors duration-500 relative z-10" />
                <div className="absolute inset-0 bg-church-gold scale-0 group-hover:scale-100 transition-transform duration-500 origin-bottom-right" />
              </div>
              <h3 className="text-3xl font-serif font-bold mb-6">Misión</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {mission}
              </p>
            </div>

            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-soft transition-all hover:shadow-strong group">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-church-navy transition-colors duration-500 overflow-hidden relative">
                <Target className="w-8 h-8 text-church-navy group-hover:text-white transition-colors duration-500 relative z-10" />
                <div className="absolute inset-0 bg-church-navy scale-0 group-hover:scale-100 transition-transform duration-500 origin-bottom-right" />
              </div>
              <h3 className="text-3xl font-serif font-bold mb-6">Visión</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {vision}
              </p>
            </div>

            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-soft transition-all hover:shadow-strong lg:col-span-1 md:col-span-2 group">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-red-500 transition-colors duration-500 overflow-hidden relative">
                <Heart className="w-8 h-8 text-red-400 group-hover:text-white transition-colors duration-500 relative z-10" />
                <div className="absolute inset-0 bg-red-500 scale-0 group-hover:scale-100 transition-transform duration-500 origin-bottom-right" />
              </div>
              <h3 className="text-3xl font-serif font-bold mb-6">Valores</h3>
              <ul className="space-y-5">
                {values.map((v, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-500 font-bold text-sm tracking-wide">
                    <div className={`w-2 h-2 rounded-full ${v.color}`}></div>
                    {v.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
