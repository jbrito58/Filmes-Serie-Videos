/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { VideoRow } from './components/VideoRow';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoLibrary } from './components/VideoLibrary';
import { CategorySection } from './components/CategorySection';
import { AdminPanel } from './components/AdminPanel';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { Video, Categoria } from './types';
import { 
  fetchVideos, 
  fetchCategories, 
  getFavoriteVideoIds, 
  toggleFavoriteVideo,
  getSavedCredentials 
} from './lib/supabase';
import { Flame, Clock, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'home' | 'catalog' | 'watch' | 'trending' | 'categories' | 'favorites' | 'admin'
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [catalogInitialCategory, setCatalogInitialCategory] = useState<string>('all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Share modal
  const [shareVideo, setShareVideo] = useState<Video | null>(null);

  // Dark/Light theme mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Supabase credentials status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      const [loadedVideos, loadedCategories] = await Promise.all([
        fetchVideos(),
        fetchCategories()
      ]);
      setVideos(loadedVideos);
      setCategories(loadedCategories);
      setFavoriteIds(getFavoriteVideoIds());
      const creds = getSavedCredentials();
      setIsSupabaseConnected(creds.isConfigured);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Featured video for HeroBanner
  const featuredVideo = useMemo(() => {
    if (videos.length === 0) return null;
    return videos.find((v) => v.destaque) || videos[0];
  }, [videos]);

  // Featured video category
  const featuredCategory = useMemo(() => {
    if (!featuredVideo) return undefined;
    return categories.find((c) => c.id === featuredVideo.categoria_id);
  }, [featuredVideo, categories]);

  // Rows sorted by criteria
  const latestVideos = useMemo(() => {
    return [...videos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [videos]);

  const trendingVideos = useMemo(() => {
    return [...videos].sort((a, b) => b.visualizacoes - a.visualizacoes);
  }, [videos]);

  const noveltyVideos = useMemo(() => {
    return [...videos].reverse();
  }, [videos]);

  const favoriteVideos = useMemo(() => {
    return videos.filter((v) => favoriteIds.includes(v.id));
  }, [videos, favoriteIds]);

  // Navigation handlers
  const handleNavigate = (view: string, params?: any) => {
    if (view === 'admin' && params?.tab) {
      setAdminTab(params.tab);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayVideo = (video: Video) => {
    setActiveVideo(video);
    setCurrentView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catId: string) => {
    setCatalogInitialCategory(catId);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (videoId: string) => {
    toggleFavoriteVideo(videoId);
    setFavoriteIds(getFavoriteVideoIds());
  };

  const handleOpenShare = (video: Video) => {
    setShareVideo(video);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950`}>
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim().length > 0 && currentView !== 'catalog') {
            setCurrentView('catalog');
          }
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        favoritesCount={favoriteIds.length}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Carregando a Plataforma Livre...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: HOME PAGE */}
            {currentView === 'home' && (
              <div className="space-y-6">
                {/* Hero Featured Video Banner */}
                {featuredVideo && (
                  <HeroBanner
                    video={featuredVideo}
                    category={featuredCategory}
                    onPlay={handlePlayVideo}
                    onOpenDetails={handlePlayVideo}
                    isFavorite={favoriteIds.includes(featuredVideo.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onShare={handleOpenShare}
                  />
                )}

                {/* Section: Últimos Episódios */}
                <VideoRow
                  title="Últimos Episódios"
                  subtitle="Aventuras quentinhas saindo do forno dos nossos criadores"
                  icon={<Clock className="w-5 h-5 text-emerald-400" />}
                  videos={latestVideos}
                  categories={categories}
                  onPlay={handlePlayVideo}
                  onSelect={handlePlayVideo}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleOpenShare}
                />

                {/* Section: Mais Assistidos */}
                <VideoRow
                  title="Mais Assistidos"
                  subtitle="Os episódios favoritos da criançada e de toda a família"
                  icon={<Flame className="w-5 h-5 text-rose-500" />}
                  videos={trendingVideos}
                  categories={categories}
                  onPlay={handlePlayVideo}
                  onSelect={handlePlayVideo}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleOpenShare}
                />

                {/* Section: Novidades & Risadas */}
                <VideoRow
                  title="Novidades & Risadas da Cozinha"
                  subtitle="Historinhas divertidas que ensinam a comer bem"
                  icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                  videos={noveltyVideos}
                  categories={categories}
                  onPlay={handlePlayVideo}
                  onSelect={handlePlayVideo}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleOpenShare}
                />

                {/* Section: Categorias */}
                <CategorySection
                  categories={categories}
                  videos={videos}
                  onSelectCategory={handleSelectCategory}
                />
              </div>
            )}

            {/* VIEW 2: VIDEO PLAYER WATCH PAGE */}
            {currentView === 'watch' && activeVideo && (
              <VideoPlayer
                video={activeVideo}
                category={categories.find((c) => c.id === activeVideo.categoria_id)}
                relatedVideos={videos.filter((v) => v.id !== activeVideo.id)}
                categories={categories}
                onBack={() => setCurrentView('home')}
                onSelectVideo={handlePlayVideo}
                isFavorite={favoriteIds.includes(activeVideo.id)}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleOpenShare}
              />
            )}

            {/* VIEW 3: CATALOG / BIBLIOTECA */}
            {currentView === 'catalog' && (
              <VideoLibrary
                videos={videos}
                categories={categories}
                onPlay={handlePlayVideo}
                onSelect={handlePlayVideo}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleOpenShare}
                initialCategory={catalogInitialCategory}
              />
            )}

            {/* VIEW 4: MAIS VISTOS (TRENDING) */}
            {currentView === 'trending' && (
              <VideoLibrary
                videos={trendingVideos}
                categories={categories}
                onPlay={handlePlayVideo}
                onSelect={handlePlayVideo}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleOpenShare}
              />
            )}

            {/* VIEW 5: CATEGORIAS */}
            {currentView === 'categories' && (
              <div className="py-8">
                <CategorySection
                  categories={categories}
                  videos={videos}
                  onSelectCategory={handleSelectCategory}
                />
              </div>
            )}

            {/* VIEW 6: FAVORITOS */}
            {currentView === 'favorites' && (
              <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <h1 className="text-3xl font-bold font-display text-white">Meus Episódios Favoritos</h1>
                </div>
                {favoriteVideos.length > 0 ? (
                  <VideoLibrary
                    videos={favoriteVideos}
                    categories={categories}
                    onPlay={handlePlayVideo}
                    onSelect={handlePlayVideo}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                    onShare={handleOpenShare}
                  />
                ) : (
                  <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <span className="text-4xl block">🍓</span>
                    <h3 className="text-lg font-bold text-white">Nenhum favorito guardado ainda</h3>
                    <p className="text-xs text-slate-400">Clique no coraçãozinho em qualquer episódio para salvá-lo aqui!</p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 7: PAINEL ADMINISTRATIVO */}
            {currentView === 'admin' && (
              <AdminPanel
                videos={videos}
                categories={categories}
                onRefreshData={loadData}
                onPlayVideo={handlePlayVideo}
                initialTab={adminTab}
              />
            )}
          </>
        )}
      </main>

      {/* Social Share Modal */}
      <ShareModal
        video={shareVideo}
        onClose={() => setShareVideo(null)}
      />

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
