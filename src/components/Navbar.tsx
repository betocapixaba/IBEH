import { motion } from 'motion/react';
import { Menu, X, Church, ShieldCheck, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ChurchSettings } from '../types';
import { LANGUAGES, TRANSLATIONS, LanguageCode } from '../lib/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  onAdminToggle: () => void;
  settings: ChurchSettings;
  currentLang: LanguageCode;
  setCurrentLang: (lang: LanguageCode) => void;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  isAdmin, 
  onAdminToggle, 
  settings,
  currentLang,
  setCurrentLang
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = TRANSLATIONS[currentLang];

  const navItems = [
    { name: t.home, id: 'home' },
    { name: t.history, id: 'history' },
    { name: t.about, id: 'about' },
    { name: t.ministries, id: 'ministries' },
    { name: t.pastor, id: 'pastor' },
    { name: t.events, id: 'events' },
    { name: t.gallery, id: 'gallery' },
  ];

  return (
    <nav className="fixed w-full z-50 px-4 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-soft rounded-[2.5rem] px-6 py-2">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('home')}>
              <div className="relative">
                <div className="absolute inset-0 bg-church-gold/10 blur-xl group-hover:bg-church-gold/30 transition-all rounded-full" />
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="relative w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-2xl border border-white shadow-soft transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-church-navy rounded-2xl text-white shadow-soft">
                    <Church className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-church-navy font-serif font-black text-sm sm:text-lg leading-none tracking-tight">
                  {settings.name ? settings.name.split(" ").slice(0, 3).join(" ") : "Iglesia Bautista"}
                </span>
                <span className="text-church-gold font-sans font-black text-[7px] sm:text-[9px] tracking-[0.3em] uppercase opacity-90 mt-0.5">
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
                    style={{
                      color: activeTab === item.id 
                        ? 'white' 
                        : item.id === 'history' 
                          ? '#124990' 
                          : '#4a4a92'
                    }}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-500 cursor-pointer ${
                      activeTab === item.id 
                        ? 'bg-church-navy text-white shadow-strong' 
                        : item.id === 'history'
                          ? 'hover:bg-slate-100 font-extrabold'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              
              <div className="w-px h-8 bg-slate-100 mx-2" />

              {/* Languages Flags Dropdown */}
              <div className="relative mr-2">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-slate-50 border border-slate-100 transition-all font-sans text-xs font-bold cursor-pointer"
                  title="Translate / Traducir"
                >
                  <span className="text-base select-none">{LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-500 hidden lg:inline-block">
                    {LANGUAGES.find(l => l.code === currentLang)?.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {langDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setLangDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLang(lang.code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                            currentLang === lang.code ? 'text-church-navy bg-amber-50/50 font-black' : 'text-slate-600'
                          }`}
                        >
                          <span className="text-base select-none leading-none">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onAdminToggle}
                style={{ color: isAdmin ? 'white' : '#f09a9a' }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-500 text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                  isAdmin 
                    ? 'bg-church-gold border-church-gold shadow-soft' 
                    : 'border-slate-50 hover:border-church-gold hover:text-church-gold bg-slate-50/50'
                }`}
                title="Panel de Administración"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden lg:inline">{isAdmin ? t.adminActive : t.admin}</span>
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
              style={
                activeTab === item.id 
                  ? undefined 
                  : item.id === 'history' 
                    ? { color: '#124990' } 
                    : { color: '#4a4a92' }
              }
              className={`block w-full text-left px-6 py-4 rounded-2xl text-base font-bold transition-all cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-church-navy text-white' 
                  : item.id === 'history'
                    ? 'bg-slate-50 font-extrabold'
                    : 'bg-slate-50'
              }`}
            >
              {item.name}
            </button>
          ))}

          {/* Mobile Language Selector Grid */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 px-2">Seleccionar Idioma / Select Language</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLang(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    currentLang === lang.code 
                      ? 'bg-church-navy border-church-navy text-white font-black' 
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-base select-none">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onAdminToggle();
              setIsOpen(false);
            }}
            style={!isAdmin ? { color: '#f09a9a' } : undefined}
            className="w-full text-center py-4 text-xs font-black uppercase tracking-widest hover:text-church-gold border-t border-slate-100 mt-4 cursor-pointer"
          >
            {isAdmin ? t.exitAdmin : t.panelAdmin}
          </button>
        </div>
      </motion.div>
    </nav>
  );
}
