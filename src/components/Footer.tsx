import React from 'react';
import { Tv, Heart, Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-850 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand and Mission */}
        <div className="flex flex-col items-center md:items-start space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍌</span>
            <span className="text-lg font-bold text-white font-display">Plataforma Livre</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Histórias encantadoras, curiosidades e animações criadas com Inteligência Artificial para crianças e toda a família.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
          <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
            Início
          </button>
          <button onClick={() => onNavigate('catalog')} className="hover:text-amber-400 transition-colors">
            Biblioteca
          </button>
          <button onClick={() => onNavigate('categories')} className="hover:text-amber-400 transition-colors">
            Categorias
          </button>
          <button onClick={() => onNavigate('favorites')} className="hover:text-amber-400 transition-colors">
            Meus Favoritos
          </button>
          <button onClick={() => onNavigate('admin')} className="hover:text-amber-400 transition-colors">
            Área Administrativa
          </button>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 text-center md:text-right">
          <p>© {new Date().getFullYear()} Plataforma Livre. Todos os direitos reservados.</p>
          <p className="text-[11px] text-slate-400 mt-1">Feito com carinho para inspirar hábitos saudáveis.</p>
        </div>

      </div>
    </footer>
  );
};
