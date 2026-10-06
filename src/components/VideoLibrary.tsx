import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Film, Sparkles, Frown } from 'lucide-react';
import { Video, Categoria } from '../types';
import { VideoCard } from './VideoCard';

interface VideoLibraryProps {
  videos: Video[];
  categories: Categoria[];
  onPlay: (video: Video) => void;
  onSelect: (video: Video) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onShare: (video: Video) => void;
  initialCategory?: string;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  categories,
  onPlay,
  onSelect,
  favoriteIds,
  onToggleFavorite,
  onShare,
  initialCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes' | 'title'>('recent');

  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        const matchesCategory = selectedCategory === 'all' || video.categoria_id === selectedCategory;
        const matchesSearch = 
          video.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'views') {
          return b.visualizacoes - a.visualizacoes;
        }
        if (sortBy === 'likes') {
          return (b.curtidas || 0) - (a.curtidas || 0);
        }
        if (sortBy === 'title') {
          return a.titulo.localeCompare(b.titulo);
        }
        return 0;
      });
  }, [videos, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Film className="w-4 h-4 text-emerald-400" />
              <span>Catálogo Completo</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Biblioteca de Episódios
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Explore aventuras cheias de humor, músicas e lições de nutrição com nossos personagens animados por inteligência artificial.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Pesquisar por título ou ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Filter Bar & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Category Tabs (Interactive Segmented controls) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todos ({videos.length})
            </button>
            {categories.map((cat) => {
              const count = videos.filter(v => v.categoria_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icone}</span>
                  <span>{cat.nome}</span>
                  <span className="opacity-70 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400"
            >
              <option value="recent">Mais Recentes</option>
              <option value="views">Mais Assistidos</option>
              <option value="likes">Mais Curtidos</option>
              <option value="title">Ordem Alfabética</option>
            </select>
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => {
              const cat = categories.find((c) => c.id === video.categoria_id);
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  category={cat}
                  onPlay={onPlay}
                  onSelect={onSelect}
                  isFavorite={favoriteIds.includes(video.id)}
                  onToggleFavorite={onToggleFavorite}
                  onShare={onShare}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl">
              🥑
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-display">Nenhum episódio encontrado</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Tente buscar com outras palavras ou limpe os filtros de categoria para ver mais delícias animadas.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Limpar Filtros
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
