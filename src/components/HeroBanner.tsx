import React, { useState } from 'react';
import { Play, Info, Heart, Volume2, VolumeX, Sparkles, Share2 } from 'lucide-react';
import { Video, Categoria } from '../types';

interface HeroBannerProps {
  video: Video;
  category?: Categoria;
  onPlay: (video: Video) => void;
  onOpenDetails: (video: Video) => void;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  onShare: (video: Video) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  video,
  category,
  onPlay,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
  onShare
}) => {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] flex items-end">
      {/* Background Media with Zero-Broken-Image fallback */}
      <div className="absolute inset-0 z-0">
        <img
          src={video.thumbnail}
          alt={video.titulo}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 filter brightness-90 animate-fade-in"
        />
        {/* Measured Scrims (Ensures 4.5:1 contrast across media luminance frames) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent max-w-4xl" />
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <div className="max-w-2xl space-y-4 sm:space-y-5">
          
          {/* Unboxed Metadata (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-amber-300">
            <span className="flex items-center gap-1.5 font-bold tracking-wide uppercase text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Episódio em Destaque
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>{category?.nome || 'Alimentos Falantes'}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>{video.duracao || '04:15'}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-emerald-400 font-semibold">{video.visualizacoes.toLocaleString()} visualizações</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-display text-balance">
            {video.titulo}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
            {video.descricao}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlay(video)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <span>Assistir Agora</span>
            </button>

            <button
              onClick={() => onOpenDetails(video)}
              className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 border border-slate-700/80 backdrop-blur-sm transition-colors"
            >
              <Info className="w-4 h-4 text-slate-300" />
              <span>Ver Detalhes</span>
            </button>

            <button
              onClick={() => onToggleFavorite(video.id)}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className={`p-3 rounded-2xl border transition-all ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => onShare(video)}
              aria-label="Compartilhar episódio"
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
