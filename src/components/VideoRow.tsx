import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Video, Categoria } from '../types';
import { VideoCard } from './VideoCard';

interface VideoRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  videos: Video[];
  categories: Categoria[];
  onPlay: (video: Video) => void;
  onSelect: (video: Video) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onShare: (video: Video) => void;
}

export const VideoRow: React.FC<VideoRowProps> = ({
  title,
  subtitle,
  icon,
  videos,
  categories,
  onPlay,
  onSelect,
  favoriteIds,
  onToggleFavorite,
  onShare
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      {/* Header with Navigation arrows */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
            {icon || <Sparkles className="w-5 h-5 text-amber-400" />}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
      >
        {videos.map((video) => {
          const cat = categories.find((c) => c.id === video.categoria_id);
          return (
            <div key={video.id} className="w-[280px] sm:w-[320px] shrink-0">
              <VideoCard
                video={video}
                category={cat}
                onPlay={onPlay}
                onSelect={onSelect}
                isFavorite={favoriteIds.includes(video.id)}
                onToggleFavorite={onToggleFavorite}
                onShare={onShare}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
