import { motion } from 'motion/react';
import { Baby, Users2, Music, GraduationCap, HandHeart, Coffee } from 'lucide-react';

export default function Ministries() {
  const ministries = [
    { name: 'Ministerio Infantil', icon: Baby, desc: 'Criando a la próxima generación en el temor y conocimiento del Señor a través de métodos creativos y divertidos.' },
    { name: 'Sociedad de Jóvenes', icon: Users2, desc: 'Empoderando a la juventud para vivir una vida con propósito, centrada en Cristo en un mundo cambiante.' },
    { name: 'Alabanza y Adoración', icon: Music, desc: 'Guiando a la congregación al trono de la gracia a través de la música y la excelencia técnica.' },
    { name: 'Estudios Bíblicos', icon: GraduationCap, desc: 'Formación teológica sistemática para equipar a todo santo para la obra del ministerio.' },
    { name: 'Obra Social', icon: HandHeart, desc: 'Reflejando la compasión de Cristo mediante el servicio tangible a los miembros más vulnerables de Hartford.' },
    { name: 'Confraternidad', icon: Coffee, desc: 'Fortaleciendo el cuerpo de Cristo a través del compañerismo, la hospitalidad y la koinonia.' },
  ];

  return (
    <div className="pt-40 pb-32 max-w-7xl mx-auto px-6">
      <div className="text-center mb-24 space-y-8 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-4">
           <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Servicio y Crecimiento</span>
           <h1 className="text-5xl md:text-7xl font-serif font-black text-church-navy leading-tight">Nuestros Ministerios</h1>
        </div>
        <p className="text-slate-500 text-xl leading-relaxed font-medium">
          Hay un lugar diseñado por Dios para que Tú contribuyas. Descubre cómo puedes servir y ser edificado en nuestra gran familia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {ministries.map((min, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="group relative bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft hover:shadow-strong transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-church-gold/10 transition-colors" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-church-navy mb-8 border border-slate-100 group-hover:bg-church-navy group-hover:text-white transition-all duration-500">
                <min.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4 group-hover:text-church-gold transition-colors">{min.name}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{min.desc}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Más info</span>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-church-gold group-hover:text-white transition-all">
                  <HandHeart className="w-4 h-4" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
