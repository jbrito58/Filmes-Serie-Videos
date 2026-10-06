import React, { useState } from 'react';
import { X, Check, Copy, Share2, MessageCircle, Send, Twitter } from 'lucide-react';
import { Video } from '../types';

interface ShareModalProps {
  video: Video | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  const currentUrl = window.location.href;
  const shareText = `Assista ao episódio divertido "${video.titulo}" no Alimentos Falantes TV!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToWhatsapp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Compartilhar Episódio</h3>
              <p className="text-xs text-slate-400">Espalhe alegria e boa nutrição!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Thumbnail snippet */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <img
            src={video.thumbnail}
            alt={video.titulo}
            className="w-16 h-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{video.titulo}</h4>
            <span className="text-[11px] text-amber-400 font-semibold">{video.duracao || '03:30'}</span>
          </div>
        </div>

        {/* Quick Social Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={shareToWhatsapp}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/25 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-semibold">WhatsApp</span>
          </button>

          <button
            onClick={shareToTelegram}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-600/15 border border-sky-600/30 text-sky-400 hover:bg-sky-600/25 transition-colors"
          >
            <Send className="w-6 h-6" />
            <span className="text-xs font-semibold">Telegram</span>
          </button>

          <button
            onClick={shareToTwitter}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Twitter className="w-6 h-6 text-sky-400" />
            <span className="text-xs font-semibold">Twitter / X</span>
          </button>
        </div>

        {/* Copy Link input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Link Direto:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
