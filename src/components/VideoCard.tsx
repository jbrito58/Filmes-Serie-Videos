import React from 'react';
import { Play, Heart, Clock, Eye, Share2 } from 'lucide-react';
import { Video, Categoria } from '../types';

interface VideoCardProps {
  video: Video;
  category?: Categoria;
  onPlay: (video: Video) => void;
  onSelect: (video: Video) => void;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  onShare?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  category,
  onPlay,
  onSelect,
  isFavorite,
  onToggleFavorite,
  onShare
}) => {
  return (
    <article className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
      {/* Thumbnail Aspect 16:9 */}
      <div 
        className="relative aspect-video w-full overflow-hidden bg-slate-800 cursor-pointer"
        onClick={() => onPlay(video)}
      >
        <img
          src={video.thumbnail}
          alt={video.titulo}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Styled fallback container on error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        
        {/* Play Button Overlay on hover */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          </div>
        </div>

        {/* Video Duration Badge */}
        {video.duracao && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{video.duracao}</span>
          </div>
        )}

        {/* Featured Tag (if applicable) */}
        {video.destaque && (
          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
            Destaque
          </div>
        )}

        {/* Favorite Quick Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(video.id);
          }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-sm flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Unboxed Metadata (Zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
            <span className="text-amber-400 font-semibold">{category?.nome || 'Alimento'}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3 h-3 text-slate-400" />
              {video.visualizacoes.toLocaleString()}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(video)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug cursor-pointer"
          >
            {video.titulo}
          </h3>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <span className="truncate max-w-[130px]">{video.autor || 'Alimentos Falantes TV'}</span>
          <div className="flex items-center gap-1">
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(video);
                }}
                className="p-1.5 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onPlay(video)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-amber-400" />
              <span>Ver</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
