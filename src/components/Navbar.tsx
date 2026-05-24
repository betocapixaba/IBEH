import { motion } from 'motion/react';
import { Menu, X, Church, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ChurchSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  onAdminToggle: () => void;
  settings: ChurchSettings;
}

export default function Navbar({ activeTab, setActiveTab, isAdmin, onAdminToggle, settings }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Inicio', id: 'home' },
    { name: 'Historia', id: 'history' },
    { name: 'Quiénes somos', id: 'about' },
    { name: 'Ministerios', id: 'ministries' },
    { name: 'Pastor', id: 'pastor' },
    { name: 'Eventos', id: 'events' },
    { name: 'Galería', id: 'gallery' },
  ];

  return (
    <nav className="fixed w-full z-50 px-4 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-soft rounded-[2.5rem] px-8 py-3">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setActiveTab('home')}>
              <div className="relative">
                <div className="absolute inset-0 bg-church-gold/10 blur-xl group-hover:bg-church-gold/30 transition-all rounded-full" />
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="relative w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-2xl border border-white shadow-soft transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-church-navy rounded-2xl text-white shadow-soft">
                    <Church className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-church-navy font-serif font-black text-base sm:text-xl leading-none tracking-tight">
                  {settings.name ? settings.name.split(" ").slice(0, 3).join(" ") : "Iglesia Bautista"}
                </span>
                <span className="text-church-gold font-sans font-black text-[8px] sm:text-[10px] tracking-[0.3em] uppercase opacity-90 mt-1">
                  {settings.name ? settings.name.split(" ").slice(3).join(" ") : "Emanuel Hartford"}
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 mr-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-500 ${
                      activeTab === item.id 
                        ? 'bg-church-navy text-white shadow-strong' 
                        : 'text-slate-400 hover:text-church-navy hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              
              <div className="w-px h-8 bg-slate-100 mx-2" />

              <button
                onClick={onAdminToggle}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-500 text-[10px] font-black uppercase tracking-widest ${
                  isAdmin 
                    ? 'bg-church-gold text-white border-church-gold shadow-soft' 
                    : 'text-slate-300 border-slate-50 hover:border-church-gold hover:text-church-gold bg-slate-50/50'
                }`}
                title="Panel de Administración"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden lg:inline">{isAdmin ? 'Admin Activo' : 'Cuentas'}</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden mt-2"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-white shadow-xl rounded-[2rem] p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-6 py-4 rounded-2xl text-base font-bold transition-all ${
                activeTab === item.id ? 'bg-church-navy text-white' : 'text-slate-600 bg-slate-50'
              }`}
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={() => {
              onAdminToggle();
              setIsOpen(false);
            }}
            className="w-full text-center py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-church-gold border-t border-slate-100 mt-4"
          >
            {isAdmin ? 'Salir Administrador' : 'Panel Administrador'}
          </button>
        </div>
      </motion.div>
    </nav>
  );
}
