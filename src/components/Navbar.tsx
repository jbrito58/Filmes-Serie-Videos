import React, { useState } from 'react';
import { 
  Tv, 
  Search, 
  Film, 
  Sparkles, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Heart, 
  Flame,
  Menu,
  X,
  Database
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  favoritesCount: number;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleTheme,
  favoritesCount,
  isSupabaseConnected
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNavClick = (view: string, params?: any) => {
    onNavigate(view, params);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* ZONE 1: BRAND LOCKUP (Anti-slop compliant single clean wordmark) */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-xl select-none group-hover:rotate-12 transition-transform">🍌</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold tracking-tight font-display bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400 bg-clip-text text-transparent">
                  Alimentos Falantes TV
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1 hidden sm:block">
                  Streaming Educativo & Divertido
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors ${
                currentView === 'home'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNavClick('catalog')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                currentView === 'catalog'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-4 h-4 text-emerald-400" />
              Biblioteca
            </button>
            <button
              onClick={() => handleNavClick('trending')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                currentView === 'trending'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              Mais Vistos
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                currentView === 'categories'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Categorias
            </button>
          </nav>

          {/* ZONE 3: ACTIONS & CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input Bar */}
            <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-48 sm:w-64' : 'w-9 sm:w-10'}`}>
              {isSearchOpen ? (
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar frutas, legumes..."
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSearchChange('');
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Abrir busca"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Favorites Shortcut */}
            <button
              onClick={() => handleNavClick('favorites')}
              aria-label="Vídeos favoritos"
              title="Meus Favoritos"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-rose-400 hover:border-slate-700 transition-colors"
            >
              <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Supabase status indicator tooltip */}
            <button
              onClick={() => handleNavClick('admin', { tab: 'config' })}
              title={isSupabaseConnected ? 'Supabase Conectado' : 'Modo Demonstração / Local'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isSupabaseConnected ? 'Supabase Online' : 'Local / Demo'}</span>
            </button>

            {/* Admin Panel button */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:brightness-110 shadow-rose-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Painel Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-2 backdrop-blur-xl">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 ${
              currentView === 'home' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4 text-amber-400" />
            Início
          </button>
          <button
            onClick={() => handleNavClick('catalog')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 ${
              currentView === 'catalog' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
            }`}
          >
            <Film className="w-4 h-4 text-emerald-400" />
            Biblioteca de Vídeos
          </button>
          <button
            onClick={() => handleNavClick('trending')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 ${
              currentView === 'trending' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            Mais Assistidos
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 ${
              currentView === 'categories' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Categorias
          </button>
          <button
            onClick={() => handleNavClick('favorites')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 ${
              currentView === 'favorites' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            Favoritos ({favoritesCount})
          </button>
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 bg-slate-900 border border-slate-800 text-amber-400`}
          >
            <ShieldCheck className="w-4 h-4" />
            Painel do Administrador
          </button>
        </div>
      )}
    </header>
  );
};
