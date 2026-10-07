import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  RotateCw, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Sparkles, 
  Send, 
  Eye, 
  Calendar, 
  User, 
  Check, 
  ChevronRight,
  ThumbsUp
} from 'lucide-react';
import { Video, Categoria, Comentario } from '../types';
import { getCommentsForVideo, addCommentToVideo, incrementVideoViews } from '../lib/supabase';

interface VideoPlayerProps {
  video: Video;
  category?: Categoria;
  relatedVideos: Video[];
  categories: Categoria[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare: (video: Video) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  category,
  relatedVideos,
  categories,
  onBack,
  onSelectVideo,
  isFavorite,
  onToggleFavorite,
  onShare
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [likesCount, setLikesCount] = useState(video.curtidas || 420);
  const [hasLiked, setHasLiked] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comentario[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍓');

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Increment views and load comments on video change
  useEffect(() => {
    incrementVideoViews(video.id);
    const loadedComments = getCommentsForVideo(video.id);
    setComments(loadedComments);
    setLikesCount(video.curtidas || 420);
    setHasLiked(false);
    setIsPlaying(false);
    setCurrentTime(0);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay policy prevented playback, wait for user click
        setIsPlaying(false);
      });
    }
  }, [video.id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
      // Trigger joyful celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newCom = addCommentToVideo(video.id, {
      autor: commentAuthor || 'Fã dos Alimentos',
      emoji: selectedEmoji,
      texto: commentText
    });

    setComments(prev => [newCom, ...prev]);
    setCommentText('');
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-amber-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(video.id)}
              className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
            </button>
            <button
              onClick={() => onShare(video)}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Video Player + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Video & Content (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Player Container */}
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
              className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800/80 group"
            >
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                playsInline
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Big Center Play/Pause button when paused */}
              {!isPlaying && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[1px]"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200">
                    <Play className="w-8 h-8 fill-slate-950 ml-1" />
                  </div>
                </div>
              )}

              {/* Player Bottom Control Bar */}
              <div 
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 flex flex-col gap-2 ${
                  showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Scrubber Progress Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono tabular-nums text-slate-300">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                  />
                  <span className="text-xs font-mono tabular-nums text-slate-300">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between text-white pt-1">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button 
                      onClick={togglePlay} 
                      className="p-1.5 hover:text-amber-400 transition-colors"
                      title={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    {/* Rewind 10s */}
                    <button 
                      onClick={() => handleSkip(-10)} 
                      className="p-1.5 hover:text-amber-400 transition-colors"
                      title="Voltar 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Forward 10s */}
                    <button 
                      onClick={() => handleSkip(10)} 
                      className="p-1.5 hover:text-amber-400 transition-colors"
                      title="Avançar 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={toggleMute} className="p-1 hover:text-amber-400 transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hidden sm:block"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Speed Switcher */}
                    <div className="flex items-center gap-1 text-xs">
                      {[1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Fullscreen */}
                    <button 
                      onClick={toggleFullscreen} 
                      className="p-1.5 hover:text-amber-400 transition-colors"
                      title="Tela cheia"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Details & Meta */}
            <div className="space-y-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    <span>{category?.nome || 'Plataforma Livre'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">Classificação Livre</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    {video.titulo}
                  </h1>
                </div>

                {/* Like & Share quick buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                      hasLiked
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
                    <span>{likesCount}</span>
                  </button>

                  <button
                    onClick={() => onShare(video)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Eye className="w-4 h-4" />
                  {video.visualizacoes.toLocaleString()} visualizações
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Publicado em {new Date(video.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {video.autor || 'Plataforma Livre'}
                </span>
              </div>

              {/* Description Prose */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
                {video.descricao}
              </p>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-slate-500 font-semibold">Tags:</span>
                  {video.tags.map(tag => (
                    <span 
                      key={tag}
                      className="text-xs text-amber-300/90 font-medium hover:underline cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Kids & Family Comments Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <span>Mural das Crianças & Famílias</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                    {comments.length} recados
                  </span>
                </h3>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Seu nome ou apelido (ex: Lucas 7 anos)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="sm:w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  
                  {/* Emoji sticker selector */}
                  <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 overflow-x-auto">
                    <span className="text-[11px] text-slate-400 mr-1">Comidinha:</span>
                    {['🍓', '🍌', '🥦', '🥕', '🍎', '🥪', '✨'].map(emoji => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`text-base p-1 rounded-md transition-transform ${
                          selectedEmoji === emoji ? 'bg-amber-400/20 scale-125' : 'hover:scale-110 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Deixe um recado carinhoso para os alimentos falantes..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1 hover:brightness-110 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg shrink-0">
                      {c.emoji}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{c.autor}</span>
                        <span className="text-[10px] text-slate-500">{c.created_at}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-snug">{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Videos Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Próximos Episódios</span>
            </h3>

            <div className="space-y-3">
              {relatedVideos.map(relVideo => {
                const cat = categories.find(c => c.id === relVideo.categoria_id);
                return (
                  <div
                    key={relVideo.id}
                    onClick={() => onSelectVideo(relVideo)}
                    className="flex gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-400/50 hover:bg-slate-800/50 cursor-pointer transition-all group"
                  >
                    <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <img
                        src={relVideo.thumbnail}
                        alt={relVideo.titulo}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/80 rounded text-[9px] font-semibold text-white">
                        {relVideo.duracao || '03:30'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
                          {cat?.nome || 'Alimento'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                          {relVideo.titulo}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>{relVideo.visualizacoes.toLocaleString()} views</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transform group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
