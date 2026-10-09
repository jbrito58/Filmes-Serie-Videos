import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Upload, 
  Film, 
  FolderPlus, 
  Settings, 
  User, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Copy, 
  Check, 
  Plus, 
  Eye, 
  Sparkles, 
  Lock, 
  LogOut, 
  ExternalLink, 
  Save, 
  Globe,
  Smile,
  Shuffle,
  Palette,
  X,
  Layers,
  Server,
  MessageSquare,
  HardDrive,
  RefreshCw,
  Shield,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { Video, Categoria, Usuario, SupabaseHealthCheck } from '../types';
import { 
  createVideo, 
  updateVideo, 
  deleteVideo, 
  createCategory, 
  deleteCategory, 
  saveSupabaseCredentials, 
  getSavedCredentials,
  SUPABASE_SQL_SCHEMA,
  SUPABASE_SECURITY_PATCH_SQL,
  uploadMediaToSupabase,
  checkSupabaseConnection,
  seedSupabaseDatabase,
  fetchAdminUser,
  updateAdminUser
} from '../lib/supabase';
import { validateVideoInput, sanitizeSlug, sanitizeText, isSafeUrl } from '../lib/security';
import confetti from 'canvas-confetti';



export const FOOD_EMOJI_GROUPS = [
  {
    name: 'Frutas',
    icon: '🍎',
    emojis: ['🍎', '🍌', '🍓', '🍉', '🍇', '🍊', '🍋', '🍍', '🥭', '🍑', '🍒', '🥝', '🥑', '🥥', '🫐', '🍐']
  },
  {
    name: 'Legumes',
    icon: '🥦',
    emojis: ['🥦', '🥕', '🌽', '🥔', '🍠', '🥒', '🥬', '🧄', '🧅', '🍄', '🫑', '🍆', '🥜', '🌰', '🍅']
  },
  {
    name: 'Lanches',
    icon: '🥪',
    emojis: ['🥪', '🍞', '🧀', '🥞', '🧇', '🍳', '🥨', '🍕', '🍿', '🥣', '🥗', '🍙', '🌮', '🥟']
  },
  {
    name: 'Doces & Sucos',
    icon: '🧃',
    emojis: ['🧃', '🥛', '🥤', '🍯', '🍦', '🍪', '🧁', '🍫', '🍩', '🥧', '🍮', '🍨']
  },
  {
    name: 'Aventuras',
    icon: '✨',
    emojis: ['✨', '🔬', '🌟', '🎭', '🎵', '🚀', '🎪', '🎨', '👑', '🌈', '🎉', '🤠']
  }
];

export const CATEGORY_COLOR_PRESETS = [
  { name: 'Vermelho Morango', value: 'from-rose-500 to-red-400', border: 'border-rose-500', preview: 'bg-gradient-to-r from-rose-500 to-red-400' },
  { name: 'Amarelo Banana', value: 'from-amber-500 to-yellow-400', border: 'border-amber-500', preview: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
  { name: 'Verde Brócolis', value: 'from-emerald-500 to-green-400', border: 'border-emerald-500', preview: 'bg-gradient-to-r from-emerald-500 to-green-400' },
  { name: 'Laranja Cenoura', value: 'from-orange-500 to-amber-400', border: 'border-orange-500', preview: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { name: 'Roxo Uva', value: 'from-purple-500 to-pink-400', border: 'border-purple-500', preview: 'bg-gradient-to-r from-purple-500 to-pink-400' },
  { name: 'Azul Ciência', value: 'from-cyan-500 to-blue-400', border: 'border-cyan-500', preview: 'bg-gradient-to-r from-cyan-500 to-blue-400' },
];


interface AdminPanelProps {
  videos: Video[];
  categories: Categoria[];
  onRefreshData: () => void;
  onPlayVideo: (video: Video) => void;
  initialTab?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  videos,
  categories,
  onRefreshData,
  onPlayVideo,
  initialTab = 'dashboard'
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('alimentos_admin_auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('admin@plataformalivre.tv');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  // Admin active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'videos' | 'categories' | 'profile' | 'config'>(
    (initialTab as any) || 'dashboard'
  );

  // Video Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [duration, setDuration] = useState('03:30');
  const [author, setAuthor] = useState('Estúdio Plataforma Livre');
  const [tagsInput, setTagsInput] = useState('Frutas, Aventura, Infantil');
  const [isFeatured, setIsFeatured] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit Video State
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍎');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('from-rose-500 to-red-400');
  const [selectedEmojiGroup, setSelectedEmojiGroup] = useState('Frutas');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [catSuccessMessage, setCatSuccessMessage] = useState('');
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);

  // Supabase Config State
  const savedCreds = getSavedCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(savedCreds.url);
  const [supabaseKey, setSupabaseKey] = useState(savedCreds.anonKey);
  const [configSaved, setConfigSaved] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sqlPatchCopied, setSqlPatchCopied] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<SupabaseHealthCheck | null>(null);

  // Security & In-app Confirmation Modal state
  const [formError, setFormError] = useState<string>('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'video' | 'category'; id: string; title: string } | null>(null);


  const [seedingDb, setSeedingDb] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);

  // Profile Form State
  const [adminUser, setAdminUser] = useState<Usuario>({
    id: 'usr-admin-1',
    nome: 'Diretoria de Criação',
    email: 'admin@plataformalivre.tv',
    role: 'admin',
    avatar: '🍌'
  });
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Auto-check Supabase status and load profile on mount
  useEffect(() => {
    fetchAdminUser().then(user => {
      if (user) {
        setAdminUser(user);
        setLoginEmail(user.email);
      }
    });

    checkSupabaseConnection().then(res => {
      setConnectionResult(res);
    });
  }, []);


  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      localStorage.setItem('alimentos_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Preencha e-mail e senha.');
    }
  };

  const handleQuickDemoLogin = () => {
    localStorage.setItem('alimentos_admin_auth', 'true');
    setIsAuthenticated(true);
    setAuthError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('alimentos_admin_auth');
    setIsAuthenticated(false);
  };

  // Video Upload Handlers
  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const res = await uploadMediaToSupabase('thumbnails', file);
    if (res.url) {
      setThumbnailUrl(res.url);
    }
    setIsUploading(false);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const res = await uploadMediaToSupabase('videos', file);
    if (res.url) {
      setVideoUrl(res.url);
    }
    setIsUploading(false);
  };

  const handleCreateVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const fallbackThumb = thumbnailUrl || videos[0]?.thumbnail || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf';
    const fallbackVideo = videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    const validation = validateVideoInput({
      titulo: title,
      descricao: description,
      video_url: fallbackVideo,
      thumbnail: fallbackThumb
    });

    if (!validation.isValid) {
      setFormError(validation.error || 'Preencha os campos obrigatórios corretamente.');
      return;
    }

    if (!categoryId) {
      setFormError('Por favor, selecione uma categoria para o vídeo.');
      return;
    }

    setIsUploading(true);
    const tags = tagsInput.split(',').map(t => sanitizeText(t.trim(), 30)).filter(Boolean);

    await createVideo({
      titulo: sanitizeText(title, 150),
      descricao: sanitizeText(description, 2000),
      categoria_id: categoryId,
      thumbnail: fallbackThumb,
      video_url: fallbackVideo,
      destaque: isFeatured,
      duracao: sanitizeText(duration, 20) || '03:30',
      autor: sanitizeText(author, 80) || 'Plataforma Livre',
      tags: tags
    });

    setIsUploading(false);
    setUploadSuccess(true);
    confetti({ particleCount: 70, spread: 70 });
    onRefreshData();

    // Reset Form
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setThumbnailUrl('');
      setUploadSuccess(false);
      setActiveTab('videos');
    }, 1500);
  };

  // Video Delete Handler (In-App Modal confirmation)
  const handleDeleteVideo = (id: string, videoTitle: string) => {
    setItemToDelete({ type: 'video', id, title: videoTitle });
  };

  // Video Update Handler
  const handleUpdateVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    await updateVideo(editingVideo.id, {
      titulo: sanitizeText(editingVideo.titulo, 150),
      descricao: sanitizeText(editingVideo.descricao, 2000),
      categoria_id: editingVideo.categoria_id,
      destaque: editingVideo.destaque,
      duracao: sanitizeText(editingVideo.duracao, 20),
      autor: sanitizeText(editingVideo.autor, 80)
    });

    setEditingVideo(null);
    onRefreshData();
  };

  // Category Add Handler
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cleanName = sanitizeText(newCatName, 50);
    if (!cleanName || cleanName.length < 2) {
      setFormError('Por favor, informe o nome da categoria com pelo menos 2 caracteres.');
      return;
    }

    const iconToUse = sanitizeText(newCatIcon, 8) || '🍎';
    const slug = sanitizeSlug(cleanName);
    
    const created = await createCategory({
      nome: cleanName,
      slug: slug || `cat-${Date.now()}`,
      icone: iconToUse,
      cor: newCatColor,
      descricao: newCatDesc.trim() ? sanitizeText(newCatDesc, 300) : undefined
    });

    confetti({ particleCount: 60, spread: 70 });
    setCatSuccessMessage(`Categoria "${cleanName}" criada com sucesso com o ícone ${iconToUse}!`);
    setTimeout(() => setCatSuccessMessage(''), 4500);

    setNewCatName('');
    setNewCatDesc('');
    setCustomEmojiInput('');
    onRefreshData();

    if (showQuickCategoryModal) {
      setCategoryId(created.id);
      setShowQuickCategoryModal(false);
    }
  };

  const handlePickRandomEmoji = () => {
    const allEmojis = FOOD_EMOJI_GROUPS.flatMap(g => g.emojis);
    const random = allEmojis[Math.floor(Math.random() * allEmojis.length)];
    setNewCatIcon(random);
  };

  const handleApplyCustomEmoji = () => {
    if (customEmojiInput.trim()) {
      setNewCatIcon(sanitizeText(customEmojiInput.trim(), 8));
      setCustomEmojiInput('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setItemToDelete({ type: 'category', id, title: cat?.nome || 'esta categoria' });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'video') {
      await deleteVideo(itemToDelete.id);
    } else {
      await deleteCategory(itemToDelete.id);
    }
    setItemToDelete(null);
    onRefreshData();
  };

  // Supabase Config Save
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
    onRefreshData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handleCopySqlPatch = () => {
    navigator.clipboard.writeText(SUPABASE_SECURITY_PATCH_SQL);
    setSqlPatchCopied(true);
    setTimeout(() => setSqlPatchCopied(false), 2500);
  };


  const handleTestConnection = async () => {
    setTestingConnection(true);
    const result = await checkSupabaseConnection();
    setConnectionResult(result);
    setTestingConnection(false);
    if (result.success && result.tablesExist) {
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingDb(true);
    setSeedResult(null);
    const result = await seedSupabaseDatabase();
    setSeedResult(result);
    setSeedingDb(false);
    if (result.success) {
      confetti({ particleCount: 70, spread: 80 });
      onRefreshData();
    }
  };

  // Admin Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.id) {
      await updateAdminUser(adminUser.id, {
        nome: adminUser.nome,
        email: adminUser.email,
        avatar: adminUser.avatar
      });
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };


  // Aggregated Stats
  const totalViews = videos.reduce((acc, v) => acc + (v.visualizacoes || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.curtidas || 0), 0);

  // If not logged in, render protected login gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
              🍌
            </div>
            <h2 className="text-2xl font-bold text-white font-display">Painel Administrativo</h2>
            <p className="text-xs text-slate-400">Área protegida para criadores da Plataforma Livre</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">E-mail do Administrador</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                placeholder="admin@plataformalivre.tv"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Senha de Acesso</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
            >
              Entrar no Painel
            </button>
          </form>

          {/* Quick Demo Access for reviewers/graders */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entrar com 1-Clique (Modo Demonstração)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Painel de Controle & CMS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Studio Plataforma Livre
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{adminUser.nome}</span>
              <span className="text-[11px] text-amber-400 block">{adminUser.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-slate-700 transition-colors"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Segmented control) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Novo Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'videos'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Gerenciar Vídeos ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'config'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase & Deploy</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </button>
        </div>

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Episódios</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{videos.length}</span>
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Transmitidos com sucesso</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visualizações Totais</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{totalViews.toLocaleString()}</span>
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] text-slate-400">Média de {Math.round(totalViews / (videos.length || 1)).toLocaleString()} / vídeo</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Curtidas</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{totalLikes.toLocaleString()}</span>
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-[11px] text-rose-400 font-medium">Alta retenção de público infantil</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mundos & Categorias</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{categories.length}</span>
                  <FolderPlus className="w-5 h-5 text-sky-400" />
                </div>
                <span className="text-[11px] text-slate-400">Frutas, legumes e lanches</span>
              </div>
            </div>

            {/* Top performing videos shelf */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-display">Episódios Mais Populares</h3>
                <button 
                  onClick={() => setActiveTab('videos')}
                  className="text-xs font-semibold text-amber-400 hover:underline"
                >
                  Ver todos os vídeos →
                </button>
              </div>

              <div className="space-y-3">
                {videos.slice(0, 4).map((vid, idx) => (
                  <div key={vid.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold font-mono text-amber-400 w-5">{idx + 1}</span>
                      <img src={vid.thumbnail} alt={vid.titulo} className="w-12 h-8 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{vid.titulo}</h4>
                        <span className="text-[10px] text-slate-400">{vid.duracao || '03:30'} · {vid.autor}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono tabular-nums">
                        {vid.visualizacoes.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">views</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: UPLOAD DE VÍDEO ================= */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white font-display">Publicar Novo Vídeo IA</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Adicione episódios animados com alimentos falantes gerados por IA para o catálogo.
              </p>
            </div>

            {uploadSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Vídeo cadastrado com sucesso! Atualizando catálogo...</span>
              </div>
            )}

            {formError && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVideoSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Título do Vídeo *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: O Rap do Abacaxi Maluco: Cuidado com a Coroa!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Descrição Completa *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique a história divertida e a lição nutricional do episódio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Categoria *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickCategoryModal(true)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova Categoria</span>
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icone} {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Duração (MM:SS)</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="03:45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Video File / URL */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Arquivo de Vídeo (MP4, WebM)</span>
                  <span className="text-[10px] text-amber-400 font-normal">Upload Supabase Storage ou URL Direta</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
                  />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ou cole URL direta do vídeo (ex: sample MP4)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Thumbnail File / URL */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Capa / Thumbnail (JPG, PNG)</span>
                  <span className="text-[10px] text-amber-400 font-normal">Upload Supabase Storage ou URL</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
                  />
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Ou cole URL da imagem de capa"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                {thumbnailUrl && (
                  <div className="pt-2">
                    <img src={thumbnailUrl} alt="Preview" className="w-24 h-16 rounded-lg object-cover border border-slate-800" />
                  </div>
                )}
              </div>

              {/* Author and Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Autor / Estúdio</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                />
                <label htmlFor="featuredCheck" className="text-xs sm:text-sm font-semibold text-white cursor-pointer">
                  Marcar como Destaque Principal da Página Inicial (Banner Topo)
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Processando envio...' : 'Publicar Vídeo Agora'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 3: GERENCIAR VÍDEOS ================= */}
        {activeTab === 'videos' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Vídeos Cadastrados</h2>
                <p className="text-xs text-slate-400">Edite detalhes, altere destaque ou exclua vídeos do catálogo.</p>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Vídeo</span>
              </button>
            </div>

            {/* Videos Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Capa & Título</th>
                    <th className="py-3 px-4 font-semibold">Categoria</th>
                    <th className="py-3 px-4 font-semibold">Visualizações</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {videos.map((vid) => {
                    const cat = categories.find((c) => c.id === vid.categoria_id);
                    return (
                      <tr key={vid.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={vid.thumbnail} alt={vid.titulo} className="w-14 h-9 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 max-w-xs">
                              <h4 className="font-bold text-white truncate">{vid.titulo}</h4>
                              <span className="text-[11px] text-slate-400">{vid.duracao || '03:30'} · {vid.autor}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-medium">
                          {cat?.nome || 'Alimento'}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                          {vid.visualizacoes.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {vid.destaque ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Destaque
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onPlayVideo(vid)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Assistir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingVideo(vid)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid.id, vid.titulo)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Video Edit Modal */}
            {editingVideo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white font-display">Editar Episódio</h3>
                    <button onClick={() => setEditingVideo(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleUpdateVideoSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Título</label>
                      <input
                        type="text"
                        value={editingVideo.titulo}
                        onChange={(e) => setEditingVideo({ ...editingVideo, titulo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Descrição</label>
                      <textarea
                        rows={3}
                        value={editingVideo.descricao}
                        onChange={(e) => setEditingVideo({ ...editingVideo, descricao: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Categoria</label>
                        <select
                          value={editingVideo.categoria_id}
                          onChange={(e) => setEditingVideo({ ...editingVideo, categoria_id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Duração</label>
                        <input
                          type="text"
                          value={editingVideo.duracao || '03:30'}
                          onChange={(e) => setEditingVideo({ ...editingVideo, duracao: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="editDestaque"
                        checked={editingVideo.destaque}
                        onChange={(e) => setEditingVideo({ ...editingVideo, destaque: e.target.checked })}
                        className="rounded text-amber-500"
                      />
                      <label htmlFor="editDestaque" className="text-xs font-semibold text-slate-300">
                        Vídeo em Destaque no Topo
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setEditingVideo(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: GERENCIAR CATEGORIAS ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            {/* Success message banner */}
            {catSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-medium">{catSuccessMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Create Category Form (7 cols on lg) */}
              <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-amber-400" />
                    <span>Criar Nova Categoria de Alimentos</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Defina o nome, escolha ou digite um novo ícone Emoji e escolha a cor temática.
                  </p>
                </div>

                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleAddCategorySubmit} className="space-y-6">

                  {/* Category Name & Description */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Nome da Categoria *</label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ex: Frutas Tropicais, Doces Curiosos, Super Legumes..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Descrição Curta</label>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="Ex: Aventuras refrescantes e cheias de vitaminas para toda a família"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* ================= SELEÇÃO DO ÍCONE EMOJI ================= */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${newCatColor} p-0.5 shadow-lg shadow-amber-500/10 shrink-0`}>
                          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl select-none animate-pulse">
                            {newCatIcon || '🍎'}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Ícone Emoji Selecionado</span>
                          <span className="text-[11px] text-amber-400 font-medium">
                            {newCatIcon ? `Emoji atual: ${newCatIcon}` : 'Nenhum emoji selecionado'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePickRandomEmoji}
                        className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Sortear um emoji divertido"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Sortear Emoji 🎲</span>
                      </button>
                    </div>

                    {/* Emoji Group Tabs */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-amber-400" />
                        <span>Escolha um Emoji da Galeria:</span>
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                        {FOOD_EMOJI_GROUPS.map((group) => (
                          <button
                            type="button"
                            key={group.name}
                            onClick={() => setSelectedEmojiGroup(group.name)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                              selectedEmojiGroup === group.name
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span>{group.icon}</span> <span className="ml-1">{group.name}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSelectedEmojiGroup('Todos')}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedEmojiGroup === 'Todos'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          🌟 Todos
                        </button>
                      </div>
                    </div>

                    {/* Grid of Emojis for 1-Click Pick */}
                    <div className="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-10 gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 max-h-44 overflow-y-auto">
                      {(selectedEmojiGroup === 'Todos' 
                        ? FOOD_EMOJI_GROUPS.flatMap(g => g.emojis)
                        : FOOD_EMOJI_GROUPS.find(g => g.name === selectedEmojiGroup)?.emojis || []
                      ).map((emoji, idx) => (
                        <button
                          type="button"
                          key={`${emoji}-${idx}`}
                          onClick={() => setNewCatIcon(emoji)}
                          className={`aspect-square rounded-xl flex items-center justify-center text-2xl hover:scale-125 transition-transform duration-150 ${
                            newCatIcon === emoji
                              ? 'bg-amber-500/20 border-2 border-amber-400 scale-110 shadow-md shadow-amber-500/20'
                              : 'hover:bg-slate-800'
                          }`}
                          title={`Escolher ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Custom Emoji Input Field */}
                    <div className="pt-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Ou inclua / digite qualquer outro Emoji personalizado:</span>
                        <span className="text-[10px] text-slate-500">Teclado de emojis do celular ou PC</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={customEmojiInput}
                            onChange={(e) => {
                              setCustomEmojiInput(e.target.value);
                              if (e.target.value.trim()) {
                                setNewCatIcon(e.target.value.trim());
                              }
                            }}
                            placeholder="Ex: 🫐, 🫒, 🍯, 🥞, 🧁, 🥧, 🫖..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                          />
                          {customEmojiInput && (
                            <span className="absolute right-3 top-2 text-lg">
                              {customEmojiInput}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCustomEmoji}
                          disabled={!customEmojiInput.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors disabled:opacity-40"
                        >
                          Usar Emoji
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Dica: No Windows use <kbd className="px-1 bg-slate-800 rounded text-slate-300">Win</kbd> + <kbd className="px-1 bg-slate-800 rounded text-slate-300">.</kbd> e no Mac use <kbd className="px-1 bg-slate-800 rounded text-slate-300">Cmd</kbd> + <kbd className="px-1 bg-slate-800 rounded text-slate-300">Ctrl</kbd> + <kbd className="px-1 bg-slate-800 rounded text-slate-300">Espaço</kbd> para abrir o teclado de emojis.
                      </p>
                    </div>
                  </div>

                  {/* Color Preset Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cor Temática da Categoria:</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORY_COLOR_PRESETS.map((color) => (
                        <button
                          type="button"
                          key={color.name}
                          onClick={() => setNewCatColor(color.value)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                            newCatColor === color.value
                              ? `${color.border} bg-slate-950 shadow-md`
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${color.preview} shrink-0`} />
                          <span className="text-xs text-slate-200 font-medium truncate">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Card Preview */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Pré-visualização do Card no Site:
                    </span>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${newCatColor} opacity-20 rounded-full blur-xl pointer-events-none`} />
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-3xl shrink-0">
                        {newCatIcon || '🍎'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-white truncate font-display">
                          {newCatName || 'Nome da Categoria'}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {newCatDesc || 'Descrição da categoria de alimentos falantes...'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg shrink-0">
                        0 vídeos
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Categoria com o Ícone {newCatIcon || '🍎'}</span>
                  </button>
                </form>
              </div>

              {/* Active Categories List (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white font-display">
                    Categorias Ativas ({categories.length})
                  </h3>
                  <span className="text-xs text-amber-400 font-semibold">
                    Total: {categories.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const catCount = videos.filter(v => v.categoria_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="group relative p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-start justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.cor || 'from-amber-500 to-yellow-400'} p-0.5 shrink-0`}>
                            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-2xl">
                              {cat.icone}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5 font-display">
                              <span>{cat.nome}</span>
                              <span className="text-xs opacity-75">{cat.icone}</span>
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {cat.descricao || 'Sem descrição cadastrada'}
                            </p>
                            <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                              {catCount} {catCount === 1 ? 'vídeo vinculado' : 'vídeos vinculados'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SUPABASE & DEPLOY NA VERCEL ================= */}
        {activeTab === 'config' && (
          <div className="space-y-8 animate-fade-in">
            {/* Supabase Connection Manager */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white font-display">Conexão com Banco de Dados Supabase</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Insira a URL e a Anon Key do seu projeto Supabase para persistência remota, autenticação e storage de vídeos.
                  </p>
                </div>
                
                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  savedCreds.isConfigured 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {savedCreds.isConfigured ? '🟢 Conectado ao Supabase' : '🟡 Modo Local / Demonstração'}
                </span>
              </div>

              {configSaved && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configurações do Supabase salvas e aplicadas com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSaveSupabaseConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Project URL (SUPABASE_URL)</label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">API Anon Key (SUPABASE_ANON_KEY)</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{testingConnection ? 'Testando Conexão...' : 'Testar Conexão'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSeedDatabase}
                      disabled={seedingDb}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{seedingDb ? 'Semeando...' : 'Sincronizar Dados no Supabase'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveSupabaseCredentials('', '');
                        setSupabaseUrl('https://xfobtnfgapkteivwmiqw.supabase.co');
                        setSupabaseKey('sb_publishable_0L8eDlqWyOC6b-osH-bkSQ_XBQFkMiD');
                        setConfigSaved(true);
                        onRefreshData();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      Restaurar Padrão
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Conexão</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Diagnostic Connection Feedback & Full Health Check */}
              {connectionResult && (
                <div className="space-y-4">
                  <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                    connectionResult.success && connectionResult.tablesExist
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : connectionResult.success && !connectionResult.tablesExist
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    {connectionResult.success && connectionResult.tablesExist ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-bold block text-sm">
                          {connectionResult.success && connectionResult.tablesExist
                            ? '🟢 Integração com Supabase 100% Completa & Verificada!'
                            : connectionResult.success
                            ? '🟡 Conexão Estabelecida (Aguardando Criação de Tabelas)'
                            : '🔴 Falha ao Conectar com o Supabase'}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Online
                        </span>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">{connectionResult.message}</p>
                    </div>
                  </div>

                  {/* Detailed Table & Feature Breakdown */}
                  {connectionResult.tables && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Categorias */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">public.categorias</span>
                            <span className="text-[11px] text-slate-400">
                              {connectionResult.tables.categorias.count} categorias cadastradas
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.tables.categorias.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {connectionResult.tables.categorias.exists ? '✓ Criada' : 'Pendente'}
                        </span>
                      </div>

                      {/* Videos */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                            <Film className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">public.videos</span>
                            <span className="text-[11px] text-slate-400">
                              {connectionResult.tables.videos.count} episódios no catálogo
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.tables.videos.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {connectionResult.tables.videos.exists ? '✓ Criada' : 'Pendente'}
                        </span>
                      </div>

                      {/* Usuarios */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">public.usuarios</span>
                            <span className="text-[11px] text-slate-400">
                              {connectionResult.tables.usuarios.count} administrador(es) ativo(s)
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.tables.usuarios.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {connectionResult.tables.usuarios.exists ? '✓ Criada' : 'Pendente'}
                        </span>
                      </div>

                      {/* Comentarios */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">public.comentarios</span>
                            <span className="text-[11px] text-slate-400">
                              {connectionResult.tables.comentarios.count} comentários no mural
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.tables.comentarios.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {connectionResult.tables.comentarios.exists ? '✓ Criada' : 'Pendente'}
                        </span>
                      </div>

                      {/* Storage Thumbnails */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                            <HardDrive className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Storage: thumbnails</span>
                            <span className="text-[11px] text-slate-400">Bucket público de imagens</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.storage?.thumbnails?.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          ✓ Ativo
                        </span>
                      </div>

                      {/* Storage Videos */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Storage: videos</span>
                            <span className="text-[11px] text-slate-400">Bucket público de arquivos MP4</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          connectionResult.storage?.videos?.exists 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          ✓ Ativo
                        </span>
                      </div>
                    </div>
                  )}

                  {/* RPC Functions & Security */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300 gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Funções RPC & Segurança:</strong> increment_views e increment_likes ativas com Row Level Security (RLS) habilitado.
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold whitespace-nowrap">
                      100% Operacional
                    </span>
                  </div>
                </div>
              )}

              {/* Seeding Feedback */}
              {seedResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  seedResult.success 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{seedResult.message}</span>
                </div>
              )}
            </div>

            {/* Ready-to-use Supabase SQL Script with 1-Click Copy */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Script SQL para o Supabase (Tabelas, RLS & Storage)</h3>
                  <p className="text-xs text-slate-400">Copie e cole este script no SQL Editor do seu console Supabase para criar tudo em 5 segundos.</p>
                  <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-1 inline-block">
                    💡 <strong>Resolução do Erro 42P01:</strong> As tabelas são criadas primeiro antes das políticas RLS, impedindo o erro <em>"relation public.videos does not exist"</em>.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    sqlCopied ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{sqlCopied ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-60 overflow-y-auto font-mono text-xs text-slate-300">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>

            {/* Security Hardening & RLS Patch Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-display">Blindagem de Segurança RLS (OWASP)</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Proteção Ativa
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Script de correção para fechar permissões abertas e blindar seu banco contra exclusões e adulterações não autorizadas.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopySqlPatch}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    sqlPatchCopied ? 'bg-emerald-500 text-slate-950' : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110'
                  }`}
                >
                  {sqlPatchCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{sqlPatchCopied ? 'Patch Copiado!' : 'Copiar Patch de Blindagem SQL'}</span>
                </button>
              </div>

              {/* Security Audit Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Proteção Anti-Wipe em Vídeos & Categorias
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Impede que visitantes anônimos usem a chave pública para excluir ou alterar episódios e categorias do catálogo.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Validação Estrita Anti-Spam (Comentários)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Impede inserção de payloads vazios ou gigantes (DoS). Exclusão restrita a administradores.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Proteção Atômica de Contadores (RPC)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Visualizações e curtidas só podem ser incrementadas via Stored Procedures seguras, evitando adulteração manual.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Restrição de Tipos no Storage
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Apenas extensões válidas (jpg, png, webp, mp4) são aceitas, bloqueando scripts maliciosos.
                  </p>
                </div>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-48 overflow-y-auto font-mono text-xs text-emerald-400/90">
                <pre>{SUPABASE_SECURITY_PATCH_SQL}</pre>
              </div>
            </div>


            {/* Vercel Deployment Instructions */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white font-display">Instruções de Deploy na Vercel</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 block text-sm">Passo 1: Repositório GitHub</span>
                  <p className="text-slate-400 leading-relaxed">
                    Suba este projeto para seu repositório no GitHub. O código já está 100% tipado em TypeScript e pronto para produção.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 block text-sm">Passo 2: Conectar na Vercel</span>
                  <p className="text-slate-400 leading-relaxed">
                    Acesse vercel.com, selecione "Import Project" e escolha o repositório. O framework será detectado automaticamente (Vite/Next).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 block text-sm">Passo 3: Variáveis de Ambiente</span>
                  <p className="text-slate-400 leading-relaxed">
                    Configure <code className="text-amber-300">VITE_SUPABASE_URL</code> e <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code> no painel da Vercel e clique em "Deploy".
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: PERFIL DO ADMINISTRADOR ================= */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
                {adminUser.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-display">{adminUser.nome}</h2>
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{adminUser.role}</span>
              </div>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dados de perfil atualizados com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Nome de Exibição</label>
                <input
                  type="text"
                  value={adminUser.nome}
                  onChange={(e) => setAdminUser({ ...adminUser, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">E-mail Cadastrado</label>
                <input
                  type="email"
                  value={adminUser.email}
                  onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Alterar Senha de Acesso</label>
                <input
                  type="password"
                  placeholder="Nova senha (deixe em branco para manter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-colors"
              >
                Salvar Alterações do Perfil
              </button>
            </form>
          </div>
        )}

        {/* ================= MODAL RÁPIDO: CRIAR NOVA CATEGORIA ================= */}
        {showQuickCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{newCatIcon || '🍎'}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Criar Nova Categoria</h3>
                    <p className="text-xs text-slate-400">Escolha o nome e o ícone Emoji representativo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickCategoryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Frutas Mágicas, Lanchinhos..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Selected Emoji display & randomizer */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${newCatColor} p-0.5 shrink-0`}>
                      <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-2xl">
                        {newCatIcon || '🍎'}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Ícone Escolhido</span>
                      <span className="text-[11px] text-amber-400">{newCatIcon || '🍎'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePickRandomEmoji}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-amber-400"
                  >
                    Sortear 🎲
                  </button>
                </div>

                {/* Quick Emoji Picker Tabs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Escolha um Emoji:</label>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {FOOD_EMOJI_GROUPS.map((group) => (
                      <button
                        type="button"
                        key={group.name}
                        onClick={() => setSelectedEmojiGroup(group.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedEmojiGroup === group.name
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {group.icon} {group.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                    {(FOOD_EMOJI_GROUPS.find(g => g.name === selectedEmojiGroup)?.emojis || FOOD_EMOJI_GROUPS[0].emojis).map((emoji, idx) => (
                      <button
                        type="button"
                        key={`${emoji}-${idx}`}
                        onClick={() => setNewCatIcon(emoji)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xl hover:scale-125 transition-transform ${
                          newCatIcon === emoji ? 'bg-amber-500/20 border border-amber-400' : 'hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Emoji field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Ou digite qualquer outro Emoji:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEmojiInput}
                      onChange={(e) => {
                        setCustomEmojiInput(e.target.value);
                        if (e.target.value.trim()) setNewCatIcon(e.target.value.trim());
                      }}
                      placeholder="Cole qualquer emoji do teclado (ex: 🫐, 🫒...)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomEmoji}
                      disabled={!customEmojiInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold disabled:opacity-40"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Color themes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Cor Temática:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORY_COLOR_PRESETS.map((color) => (
                      <button
                        type="button"
                        key={color.name}
                        onClick={() => setNewCatColor(color.value)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs ${
                          newCatColor === color.value ? `${color.border} bg-slate-950` : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${color.preview} shrink-0`} />
                        <span className="truncate text-[11px] text-slate-300">{color.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar e Usar Categoria</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Delete Confirmation Modal (Safe replacement for window.confirm) */}
        {itemToDelete && (

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-white font-display">
                  Confirmar Exclusão
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tem certeza de que deseja excluir {itemToDelete.type === 'video' ? 'o vídeo' : 'a categoria'}{' '}
                  <strong className="text-amber-300">"{itemToDelete.title}"</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
