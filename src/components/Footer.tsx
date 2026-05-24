import { MapPin, Phone, Mail, Facebook } from 'lucide-react';
import { ChurchSettings, Service } from '../types';

interface FooterProps {
  settings: ChurchSettings;
  services: Service[];
}

export default function Footer({ settings, services }: FooterProps) {
  return (
    <footer className="bg-church-navy text-white pt-10 pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-church-gold/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 border-b border-white/5 pb-8">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-church-gold font-black uppercase tracking-[0.4em] text-[10px]">Emanuel Hartford</span>
              <h3 className="font-serif text-3xl font-black tracking-tight leading-tight max-w-sm">
                {settings.name || "Iglesia Bautista Emanuel"}
              </h3>
            </div>
            <p className="text-slate-400 text-base leading-relaxed max-w-md font-medium">
              Unidos en fe, esperanza y caridad. Una comunidad dedicada a la transformación de vidas a través de la Palabra de Dios.
            </p>
            <div className="flex space-x-4 pt-1">
              {[Facebook].map((Icon, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-church-gold group-hover:border-church-gold transition-all duration-500">
                    <Icon className="w-4 h-4 text-slate-300 group-hover:text-church-navy transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 hidden lg:block" />

          {/* Contact */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-church-gold">Ubicación y Contacto</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <MapPin className="w-4 h-4 text-church-gold" />
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">DIRECCIÓN</p>
                  <p className="text-white text-sm leading-relaxed font-medium whitespace-pre-line">{settings.address || '449 Park Street, Hartford - CT 06106'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Phone className="w-4 h-4 text-church-gold" />
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">TELÉFONO</p>
                  <p className="text-white text-sm leading-relaxed font-medium">{settings.phone || '(860) 555-0123'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-church-gold">Horarios de Reunión</h4>
            <div className="space-y-4">
              {services && services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <div className="flex flex-col">
                      <span className="text-white font-serif font-bold text-base leading-tight">{service.day}</span>
                      <span className="text-slate-400 text-xs font-medium">{service.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-4">
                   <p className="text-slate-500 italic text-xs">Consulte el calendario actualizado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">
          <span>© {new Date().getFullYear()} {settings.name || "Iglesia Bautista Emanuel"}</span>
          <span className="text-slate-700">Enviados por Dios — Hartford, CT</span>
        </div>
      </div>
    </footer>
  );
}
