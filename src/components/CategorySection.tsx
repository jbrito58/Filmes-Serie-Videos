import React from 'react';
import { Categoria, Video } from '../types';
import { ChevronRight, Sparkles } from 'lucide-react';

interface CategorySectionProps {
  categories: Categoria[];
  videos: Video[];
  onSelectCategory: (catId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  videos,
  onSelectCategory
}) => {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mundos Temáticos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Explore por Categoria
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const catVideos = videos.filter(v => v.categoria_id === cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
            >
              {/* Background gradient hint */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.cor} opacity-10 rounded-full blur-2xl group-hover:opacity-25 transition-opacity`} />

              <div className="relative z-10 flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {cat.icone}
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                  {catVideos.length} episódios
                </span>
              </div>

              <div className="relative z-10 mt-5 space-y-1.5">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>{cat.nome}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.descricao || 'Vídeos educativos e divertidos com alimentos falantes.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
