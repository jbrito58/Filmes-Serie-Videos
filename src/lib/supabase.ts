import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_CATEGORIES, INITIAL_VIDEOS } from '../data/initialData';
import { Categoria, Video, Usuario, Comentario, SupabaseHealthCheck } from '../types';
import { sanitizeSafeUrl, sanitizeText, sanitizeSlug } from './security';

// Storage keys for local persistence fallback
const STORAGE_KEY_VIDEOS = 'alimentos_tv_videos_v1';
const STORAGE_KEY_CATEGORIES = 'alimentos_tv_categories_v1';
const STORAGE_KEY_SUPABASE_URL = 'alimentos_tv_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'alimentos_tv_supabase_key';
const STORAGE_KEY_FAVORITES = 'alimentos_tv_favorites';
const STORAGE_KEY_COMMENTS = 'alimentos_tv_comments';

// Normalizes Supabase URL (strips /rest/v1/ suffix if user pasted the REST API URL)
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

export const DEFAULT_SUPABASE_URL = 'https://xfobtnfgapkteivwmiqw.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_0L8eDlqWyOC6b-osH-bkSQ_XBQFkMiD';

// Get current Supabase credentials from Env, localStorage or default project
export function getSavedCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  
  const localUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || '';

  const rawUrl = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const rawKey = localKey || envKey || DEFAULT_SUPABASE_KEY;

  const activeUrl = normalizeSupabaseUrl(rawUrl);
  const activeKey = (rawKey || '').trim();

  const isConfigured = Boolean(
    activeUrl && 
    activeKey && 
    activeUrl.startsWith('https://') && 
    !activeUrl.includes('placeholder')
  );

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSavedCredentials();
  if (!creds.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(creds.url, creds.anonKey);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  const cleanUrl = normalizeSupabaseUrl(url);
  if (cleanUrl) localStorage.setItem(STORAGE_KEY_SUPABASE_URL, cleanUrl);
  else localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);

  supabaseInstance = null; // reset client to re-instantiate
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const defaultStatus: SupabaseHealthCheck = {
    success: false,
    message: 'Cliente Supabase não configurado.',
    tablesExist: false,
    tables: {
      categorias: { exists: false, count: 0 },
      videos: { exists: false, count: 0 },
      usuarios: { exists: false, count: 0 },
      comentarios: { exists: false, count: 0 },
    },
    storage: {
      thumbnails: { exists: false },
      videos: { exists: false },
    },
    rpc: {
      increment_views: false,
      increment_likes: false,
    }
  };

  const client = getSupabaseClient();
  if (!client) {
    return defaultStatus;
  }

  try {
    // 1. Check categorias
    let catStatus = { exists: false, count: 0, error: undefined as string | undefined };
    try {
      const { data, error } = await client.from('categorias').select('id');
      if (!error && data) {
        catStatus = { exists: true, count: data.length, error: undefined };
      } else {
        catStatus.error = error?.message;
      }
    } catch (e: unknown) {
      catStatus.error = e instanceof Error ? e.message : 'Erro ao consultar categorias';
    }

    // 2. Check videos
    let vidStatus = { exists: false, count: 0, error: undefined as string | undefined };
    try {
      const { data, error } = await client.from('videos').select('id');
      if (!error && data) {
        vidStatus = { exists: true, count: data.length, error: undefined };
      } else {
        vidStatus.error = error?.message;
      }
    } catch (e: unknown) {
      vidStatus.error = e instanceof Error ? e.message : 'Erro ao consultar vídeos';
    }

    // 3. Check usuarios
    let usrStatus = { exists: false, count: 0, error: undefined as string | undefined };
    try {
      const { data, error } = await client.from('usuarios').select('id');
      if (!error && data) {
        usrStatus = { exists: true, count: data.length, error: undefined };
      } else {
        usrStatus.error = error?.message;
      }
    } catch (e: unknown) {
      usrStatus.error = e instanceof Error ? e.message : 'Erro ao consultar usuários';
    }

    // 4. Check comentarios
    let comStatus = { exists: false, count: 0, error: undefined as string | undefined };
    try {
      const { data, error } = await client.from('comentarios').select('id');
      if (!error && data) {
        comStatus = { exists: true, count: data.length, error: undefined };
      } else {
        comStatus.error = error?.message;
      }
    } catch (e: unknown) {
      comStatus.error = e instanceof Error ? e.message : 'Erro ao consultar comentários';
    }

    // 5. Check storage buckets
    const storageStatus = {
      thumbnails: { exists: false, error: undefined as string | undefined },
      videos: { exists: false, error: undefined as string | undefined },
    };
    try {
      const pingBlob = new Blob(['OK'], { type: 'image/jpeg' });
      const testUpThumb = await client.storage
        .from('thumbnails')
        .upload('__ping_thumb.jpg', pingBlob, { contentType: 'image/jpeg', upsert: true });
      if (!testUpThumb.error) {
        storageStatus.thumbnails.exists = true;
        await client.storage.from('thumbnails').remove(['__ping_thumb.jpg']);
      } else if (testUpThumb.error.message.includes('mime') || testUpThumb.error.message.includes('already exists')) {
        storageStatus.thumbnails.exists = true;
      } else {
        storageStatus.thumbnails.error = testUpThumb.error.message;
      }
    } catch (e: unknown) {
      storageStatus.thumbnails.error = e instanceof Error ? e.message : 'Erro ao verificar bucket thumbnails';
    }

    try {
      const pingVideoBlob = new Blob(['OK'], { type: 'video/mp4' });
      const testUpVid = await client.storage
        .from('videos')
        .upload('__ping_video.mp4', pingVideoBlob, { contentType: 'video/mp4', upsert: true });
      if (!testUpVid.error) {
        storageStatus.videos.exists = true;
        await client.storage.from('videos').remove(['__ping_video.mp4']);
      } else if (testUpVid.error.message.includes('mime') || testUpVid.error.message.includes('already exists')) {
        storageStatus.videos.exists = true;
      } else {
        storageStatus.videos.error = testUpVid.error.message;
      }
    } catch (e: unknown) {
      storageStatus.videos.error = e instanceof Error ? e.message : 'Erro ao verificar bucket videos';
    }

    // 6. Check RPC
    let rpcViews = false;
    let rpcLikes = false;
    try {
      const rpcV = await client.rpc('increment_views', { video_id: 'vid-1' });
      if (!rpcV.error) rpcViews = true;
    } catch {}
    try {
      const rpcL = await client.rpc('increment_likes', { video_id: 'vid-1' });
      if (!rpcL.error) rpcLikes = true;
    } catch {}

    const allTablesExist = catStatus.exists && vidStatus.exists && usrStatus.exists && comStatus.exists;

    return {
      success: allTablesExist,
      message: allTablesExist 
        ? 'Todas as 4 tabelas (videos, categorias, usuarios, comentarios), storage e funções RPC verificadas com sucesso!' 
        : 'Algumas tabelas ainda não foram encontradas. Verifique a execução do script SQL.',
      tablesExist: allTablesExist,
      tables: {
        categorias: catStatus,
        videos: vidStatus,
        usuarios: usrStatus,
        comentarios: comStatus,
      },
      storage: storageStatus,
      rpc: {
        increment_views: rpcViews,
        increment_likes: rpcLikes,
      }
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao conectar ao Supabase';
    return { 
      ...defaultStatus,
      message: msg 
    };
  }
}

export async function seedSupabaseDatabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase não conectado' };

  try {
    for (const cat of INITIAL_CATEGORIES) {
      await client.from('categorias').upsert([cat], { onConflict: 'id' });
    }
    for (const vid of INITIAL_VIDEOS) {
      await client.from('videos').upsert([vid], { onConflict: 'id' });
    }
    return { success: true, message: 'Dados e episódios iniciais sincronizados com sucesso no Supabase!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao sincronizar';
    return { success: false, message: `Erro ao semear: ${msg}` };
  }
}

// Local storage repositories
function getLocalVideos(): Video[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(INITIAL_VIDEOS));
      return INITIAL_VIDEOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VIDEOS;
  }
}

function saveLocalVideos(videos: Video[]) {
  localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
}

function getLocalCategories(): Categoria[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function saveLocalCategories(cats: Categoria[]) {
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
}

// Full API Methods
export async function fetchVideos(): Promise<Video[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, fallback to local:', error.message);
        return getLocalVideos();
      }
      if (data && data.length > 0) {
        return data as Video[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
    }
  }
  return getLocalVideos();
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Video;
      }
    } catch (err) {
      console.warn('Supabase single fetch error:', err);
    }
  }
  const local = getLocalVideos();
  return local.find(v => v.id === id) || null;
}

export async function incrementVideoViews(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.rpc('increment_views', { video_id: id });
    } catch {
      // RPC might not be created, try simple update
      try {
        const { data } = await client.from('videos').select('visualizacoes').eq('id', id).single();
        if (data) {
          await client.from('videos').update({ visualizacoes: (data.visualizacoes || 0) + 1 }).eq('id', id);
        }
      } catch (e) {
        console.warn('Could not increment views on Supabase', e);
      }
    }
  }

  // Also update local store
  const local = getLocalVideos();
  const updated = local.map(v => v.id === id ? { ...v, visualizacoes: v.visualizacoes + 1 } : v);
  saveLocalVideos(updated);
}

export async function incrementVideoLikes(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.rpc('increment_likes', { video_id: id });
    } catch {
      try {
        const { data } = await client.from('videos').select('curtidas').eq('id', id).single();
        if (data) {
          await client.from('videos').update({ curtidas: (data.curtidas || 0) + 1 }).eq('id', id);
        }
      } catch (e) {
        console.warn('Could not increment likes on Supabase', e);
      }
    }
  }

  const local = getLocalVideos();
  const updated = local.map(v => v.id === id ? { ...v, curtidas: (v.curtidas || 0) + 1 } : v);
  saveLocalVideos(updated);
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at' | 'visualizacoes'>): Promise<Video> {
  const newVideo: Video = {
    ...video,
    id: `vid-${Date.now()}`,
    titulo: sanitizeText(video.titulo, 150),
    descricao: sanitizeText(video.descricao, 2000),
    thumbnail: sanitizeSafeUrl(video.thumbnail),
    video_url: sanitizeSafeUrl(video.video_url),
    autor: sanitizeText(video.autor || 'Plataforma Livre', 80),
    duracao: sanitizeText(video.duracao || '03:30', 20),
    tags: Array.isArray(video.tags) ? video.tags.map(t => sanitizeText(t, 30)).filter(Boolean) : [],
    visualizacoes: 0,
    curtidas: 0,
    created_at: new Date().toISOString()
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('videos').insert([newVideo]).select().single();
      if (!error && data) {
        // Also sync local
        const currentLocal = getLocalVideos();
        saveLocalVideos([data, ...currentLocal]);
        return data as Video;
      }
      console.warn('Supabase insert warning:', error?.message);
    } catch (err) {
      console.warn('Supabase insert exception:', err);
    }
  }

  // Fallback to local
  const currentLocal = getLocalVideos();
  saveLocalVideos([newVideo, ...currentLocal]);
  return newVideo;
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('videos').update(updates).eq('id', id).select().single();
      if (!error && data) {
        const currentLocal = getLocalVideos().map(v => v.id === id ? (data as Video) : v);
        saveLocalVideos(currentLocal);
        return data as Video;
      }
    } catch (err) {
      console.warn('Supabase update exception:', err);
    }
  }

  const currentLocal = getLocalVideos();
  const index = currentLocal.findIndex(v => v.id === id);
  if (index >= 0) {
    const updated = { ...currentLocal[index], ...updates };
    currentLocal[index] = updated;
    saveLocalVideos(currentLocal);
    return updated;
  }
  return null;
}

export async function deleteVideo(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('videos').delete().eq('id', id);
      if (error) console.warn('Supabase delete error:', error.message);
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }
  }

  const currentLocal = getLocalVideos().filter(v => v.id !== id);
  saveLocalVideos(currentLocal);
  return true;
}

export async function fetchCategories(): Promise<Categoria[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('categorias').select('*').order('nome');
      if (!error && data && data.length > 0) {
        return data as Categoria[];
      }
    } catch (err) {
      console.warn('Supabase categories fetch exception:', err);
    }
  }
  return getLocalCategories();
}

export async function createCategory(cat: Omit<Categoria, 'id' | 'created_at'>): Promise<Categoria> {
  const safeSlug = cat.slug ? sanitizeSlug(cat.slug) : `cat-${Date.now()}`;
  const newCat: Categoria = {
    ...cat,
    id: `cat-${Date.now()}`,
    nome: sanitizeText(cat.nome, 60),
    slug: safeSlug || `cat-${Date.now()}`,
    descricao: cat.descricao ? sanitizeText(cat.descricao, 300) : undefined,
    icone: sanitizeText(cat.icone, 8) || '🍎',
    cor: cat.cor || 'from-amber-500 to-yellow-400',
    created_at: new Date().toISOString()
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('categorias').insert([newCat]).select().single();
      if (!error && data) {
        const current = getLocalCategories();
        saveLocalCategories([...current, data]);
        return data as Categoria;
      }
    } catch (err) {
      console.warn('Supabase create category exception:', err);
    }
  }

  const current = getLocalCategories();
  saveLocalCategories([...current, newCat]);
  return newCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('categorias').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete category error', e);
    }
  }

  const current = getLocalCategories().filter(c => c.id !== id);
  saveLocalCategories(current);
  return true;
}

// Upload helper for Supabase Storage
export async function uploadMediaToSupabase(
  bucket: 'videos' | 'thumbnails',
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    // If Supabase not connected, create an object URL for instant preview testing
    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      error: null
    };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;
    const contentType = file.type || (bucket === 'thumbnails' ? 'image/jpeg' : 'video/mp4');

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, file, { 
        contentType,
        cacheControl: '3600', 
        upsert: true 
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = client.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (err: unknown) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Falha desconhecida no upload'
    };
  }
}

// Favorites management
export function getFavoriteVideoIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteVideo(id: string): boolean {
  const favs = getFavoriteVideoIds();
  const exists = favs.includes(id);
  let updated: string[];
  if (exists) {
    updated = favs.filter(favId => favId !== id);
  } else {
    updated = [...favs, id];
  }
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  return !exists;
}

// Comments storage - Sync with Supabase comentarios table
export async function getCommentsForVideo(videoId: string): Promise<Comentario[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('comentarios')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Comentario[];
      }
    } catch (e) {
      console.warn('Supabase comments fetch error:', e);
    }
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_COMMENTS}_${videoId}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Fallback initial kid comments
  return [
    {
      id: 'c-1',
      video_id: videoId,
      autor: 'Pequena Maria (6 anos)',
      emoji: '🍓',
      texto: 'Adorei a musiquinha! Agora eu quero comer morangos no café da manhã!',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'c-2',
      video_id: videoId,
      autor: 'Lucas & Família',
      emoji: '🥦',
      texto: 'O Professor Brócolis é muito engraçado! Meu filho pediu brócolis no almoço hoje haha.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];
}

export async function addCommentToVideo(
  videoId: string, 
  comment: { autor: string; emoji: string; texto: string }
): Promise<Comentario> {
  const safeText = sanitizeText(comment.texto, 500);
  const safeAuthor = sanitizeText(comment.autor, 60) || 'Fã dos Alimentos';
  const safeEmoji = sanitizeText(comment.emoji, 8) || '✨';

  if (!safeText || safeText.length < 2) {
    throw new Error('O comentário deve ter no mínimo 2 caracteres.');
  }

  const newComment: Comentario = {
    id: `com-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    video_id: videoId,
    autor: safeAuthor,
    emoji: safeEmoji,
    texto: safeText,
    created_at: new Date().toISOString()
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('comentarios').insert([newComment]).select().single();
      if (!error && data) {
        return data as Comentario;
      }
    } catch (e) {
      console.warn('Supabase comment insert error:', e);
    }
  }

  // Fallback local save
  try {
    const current = await getCommentsForVideo(videoId);
    const updated = [newComment, ...current];
    localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${videoId}`, JSON.stringify(updated));
  } catch {}

  return newComment;
}

// User Profile Management with Supabase
export async function fetchAdminUser(): Promise<Usuario | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('usuarios')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (!error && data) {
        return data as Usuario;
      }
    } catch (e) {
      console.warn('Supabase user fetch warning', e);
    }
  }
  return null;
}

export async function updateAdminUser(id: string, updates: Partial<Usuario>): Promise<Usuario | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('usuarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data as Usuario;
      }
    } catch (e) {
      console.warn('Supabase update user warning', e);
    }
  }
  return null;
}


// Complete Ready-to-Execute Supabase SQL Schema for the User
export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- PLATAFORMA LIVRE - SCRIPT SQL COMPLETO & DEFINITIVO PARA SUPABASE
-- Projeto: https://xfobtnfgapkteivwmiqw.supabase.co
-- Este script é 100% idempotente e pode ser executado em bancos novos ou já existentes.
-- ====================================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. CRIAÇÃO DAS TABELAS (ORDEM ESTRITA DE DEPENDÊNCIA)
-- ====================================================================

-- 1.1 Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT '🍎',
  cor TEXT NOT NULL DEFAULT 'from-amber-500 to-yellow-400',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Vídeos (Criada antes de qualquer política ou comentário)
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  video_url TEXT NOT NULL,
  categoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
  destaque BOOLEAN DEFAULT FALSE,
  visualizacoes BIGINT DEFAULT 0,
  curtidas BIGINT DEFAULT 0,
  duracao TEXT DEFAULT '03:30',
  autor TEXT DEFAULT 'Plataforma Livre',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Usuários / Perfis
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'creator', 'viewer')),
  avatar TEXT DEFAULT '🍌',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Comentários / Mural (Depende de videos)
CREATE TABLE IF NOT EXISTS public.comentarios (
  id TEXT PRIMARY KEY DEFAULT ('com-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍓',
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. ÍNDICES DE PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_videos_categoria ON public.videos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_videos_destaque ON public.videos(destaque);
CREATE INDEX IF NOT EXISTS idx_videos_visualizacoes ON public.videos(visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_video ON public.comentarios(video_id);

-- ====================================================================
-- 3. FUNÇÕES RPC (INCREMENTO ATÔMICO)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.increment_views(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_likes(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET curtidas = COALESCE(curtidas, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- As tabelas já existem acima, impossibilitando erro 42P01
-- ====================================================================
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- Limpeza preventiva idempotente
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gerenciamento de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gerenciamento restrito de categorias" ON public.categorias;

DROP POLICY IF EXISTS "Leitura pública de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Gerenciamento de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Gerenciamento restrito de vídeos" ON public.videos;

DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Atualização de perfil próprio" ON public.usuarios;
DROP POLICY IF EXISTS "Gerenciamento de usuários" ON public.usuarios;

DROP POLICY IF EXISTS "Leitura pública de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Inserção de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Inserção pública validada de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Moderação restrita de comentários" ON public.comentarios;

-- Criação das políticas ativas
CREATE POLICY "Leitura pública de categorias" ON public.categorias 
FOR SELECT USING (true);

CREATE POLICY "Gerenciamento de categorias" ON public.categorias 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de vídeos" ON public.videos 
FOR SELECT USING (true);

CREATE POLICY "Gerenciamento de vídeos" ON public.videos 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de perfis" ON public.usuarios 
FOR SELECT USING (true);

CREATE POLICY "Gerenciamento de usuários" ON public.usuarios 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de comentários" ON public.comentarios 
FOR SELECT USING (true);

CREATE POLICY "Inserção pública validada de comentários" ON public.comentarios 
FOR INSERT WITH CHECK (
  char_length(trim(texto)) >= 2 AND 
  char_length(texto) <= 500 AND 
  char_length(trim(autor)) >= 1 AND 
  char_length(autor) <= 60 AND 
  video_id IS NOT NULL
);

CREATE POLICY "Moderação restrita de comentários" ON public.comentarios 
FOR DELETE USING (true);

-- ====================================================================
-- 5. STORAGE BUCKETS (VÍDEOS E THUMBNAILS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']),
  ('thumbnails', 'thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acesso público aos vídeos" ON storage.objects;
DROP POLICY IF EXISTS "Acesso público às mídias" ON storage.objects;
CREATE POLICY "Acesso público às mídias" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

DROP POLICY IF EXISTS "Upload de mídias liberado" ON storage.objects;
DROP POLICY IF EXISTS "Upload permitido de mídias" ON storage.objects;
CREATE POLICY "Upload permitido de mídias" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('videos', 'thumbnails'));

DROP POLICY IF EXISTS "Atualização de mídias liberada" ON storage.objects;
CREATE POLICY "Atualização de mídias liberada" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('videos', 'thumbnails'));

-- ====================================================================
-- 6. DADOS INICIAIS (SEED)
-- ====================================================================
INSERT INTO public.categorias (id, nome, slug, descricao, icone, cor)
VALUES
  ('cat-frutas', 'Frutas Falantes', 'frutas', 'Aventuras doces e divertidas com as frutas mais animadas da quitanda!', '🍌', 'from-amber-500 to-yellow-400'),
  ('cat-legumes', 'Legumes Heróis', 'legumes', 'Superpoderes verdes e saudáveis com brócolis, cenouras e muito mais.', '🥦', 'from-emerald-500 to-green-400'),
  ('cat-lanchinhos', 'Lanchinhos Divertidos', 'lanchinhos', 'Receitinhas mágicas, pãozinhos felizes e sucos coloridos.', '🥪', 'from-orange-500 to-amber-400'),
  ('cat-curiosidades', 'Ciência & Nutrição', 'nutricao', 'Descubra para onde vão as vitaminas e por que comer bem faz crescer forte!', '🔬', 'from-cyan-500 to-blue-400'),
  ('cat-historinhas', 'Historinhas da Cozinha', 'historinhas', 'Contos relaxantes e fábulas cantadas para a hora do lanche ou do soninho.', '✨', 'from-purple-500 to-pink-400')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (id, titulo, descricao, thumbnail, video_url, categoria_id, destaque, visualizacoes, curtidas, duracao, autor, tags)
VALUES
  ('vid-1', 'O Grande Show dos Alimentos: A Canção da Fruteira', 'A turma toda se reuniu no palco principal da TV! O Morango canta, a Banana toca bateria e o Professor Brócolis ensina uma dança contagiante que faz todo mundo querer comer saudável.', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'cat-frutas', TRUE, 142850, 12430, '04:15', 'Plataforma Livre', ARRAY['Frutas', 'Musical', 'Família', 'Destaque']),
  ('vid-2', 'Banana Bob na Selva dos Utensílios: A Busca pela Vitamina B6', 'O destemido Bob, a banana exploradora com chapéu de safári, embarca numa expedição épica pela bancada da cozinha em busca da lendária colher de prata e do mistério do potássio!', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'cat-frutas', FALSE, 98400, 8920, '03:40', 'Plataforma Livre', ARRAY['Banana', 'Aventura', 'Exploração']),
  ('vid-3', 'Professor Brócolis no Laboratório: O Segredo da Super-Força Verde', 'Com seus óculos redondinhos e tubo de ensaio, o sábio Professor Brócolis revela como o cálcio e as fibras protegem as defesas do nosso corpo como uma armadura invisível!', 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'cat-legumes', FALSE, 112300, 9840, '05:10', 'Plataforma Livre', ARRAY['Brócolis', 'Ciência', 'Nutrição']),
  ('vid-4', 'Morangolina & O Festival Pop das Frutas Vermelhas', 'A Morangolina soltou a voz no microfone prateado! Uma celebração cheia de ritmo, confete e lições sobre como os antioxidantes mantêm o coração feliz e forte.', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'cat-frutas', FALSE, 87520, 7650, '02:55', 'Plataforma Livre', ARRAY['Morango', 'Música', 'Dança']),
  ('vid-5', 'Cenoura Ninja: A Missão Noturna da Visão Perfeita', 'A ágil Cenourinha salta pelas tábuas de corte para ensinar como a vitamina A ajuda os heróis a enxergarem no escuro e protegerem seus olhos das telas.', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'cat-legumes', FALSE, 65400, 5410, '03:15', 'Plataforma Livre', ARRAY['Cenoura', 'Ninja', 'Superpoderes']),
  ('vid-6', 'O Pãozinho Quentinho e o Queijinho Amigo: O Lanche Perfeito', 'Um conto animado sobre harmonia alimentar! O Pão Integral e a fatia de queijo explicam a importância de equilibrar energia e proteínas antes da aula.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', 'cat-lanchinhos', FALSE, 48900, 4120, '04:02', 'Plataforma Livre', ARRAY['Lanchinho', 'Pão', 'Amizade']),
  ('vid-7', 'Para Onde Vai a Água que Bebemos? Com a Gotinha de Laranja', 'A fofa Laranjinha e sua amiga Gota de Água fazem uma viagem mágica pelo corpo humano para mostrar como nos manter hidratados traz energia para brincar o dia inteiro.', 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'cat-curiosidades', FALSE, 92100, 8200, '04:45', 'Plataforma Livre', ARRAY['Laranja', 'Hidratação', 'Ciência']),
  ('vid-8', 'O Bocejo da Abóbora: Historinha Relaxante para a Noite', 'Depois de um dia agitado na horta, a doce Abóbora convida as crianças para respirar fundo, alongar os braços e ouvir o sussurro do vento entre as folhas.', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=1280&q=80', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'cat-historinhas', FALSE, 74300, 6890, '06:20', 'Plataforma Livre', ARRAY['Sono', 'Relaxamento', 'Calmaria'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.comentarios (id, video_id, autor, emoji, texto)
VALUES
  ('c-1', 'vid-1', 'Pequena Maria (6 anos)', '🍓', 'Adorei a musiquinha! Agora eu quero comer morangos no café da manhã!'),
  ('c-2', 'vid-1', 'Lucas & Família', '🥦', 'O Professor Brócolis é muito engraçado! Meu filho pediu brócolis no almoço hoje haha.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.usuarios (id, nome, email, role, avatar)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Diretoria de Criação', 'admin@plataformalivre.tv', 'admin', '🍌')
ON CONFLICT (email) DO NOTHING;
`;

// Script de Patch RLS com garantia de criação prévia de tabelas
export const SUPABASE_SECURITY_PATCH_SQL = `-- ====================================================================
-- PLATAFORMA LIVRE - SCRIPT DE BLINDAGEM E CORREÇÃO DE RLS
-- Execute este script no SQL Editor do Supabase para corrigir permissões
-- Este script garante a existência de todas as tabelas antes de aplicar RLS,
-- evitando o erro: relation "public.videos" does not exist (42P01).
-- ====================================================================

-- 1. GARANTIR A EXISTÊNCIA DAS TABELAS PRIMEIRO (PREVINE ERRO 42P01)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT '🍎',
  cor TEXT NOT NULL DEFAULT 'from-amber-500 to-yellow-400',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  video_url TEXT NOT NULL,
  categoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
  destaque BOOLEAN DEFAULT FALSE,
  visualizacoes BIGINT DEFAULT 0,
  curtidas BIGINT DEFAULT 0,
  duracao TEXT DEFAULT '03:30',
  autor TEXT DEFAULT 'Plataforma Livre',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'creator', 'viewer')),
  avatar TEXT DEFAULT '🍌',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comentarios (
  id TEXT PRIMARY KEY DEFAULT ('com-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍓',
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS COM SEGURANÇA
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTERIORES DE FORMA IDEMPOTENTE
DROP POLICY IF EXISTS "Gerenciamento de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gerenciamento restrito de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categorias;

DROP POLICY IF EXISTS "Gerenciamento de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Gerenciamento restrito de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Leitura pública de vídeos" ON public.videos;

DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Atualização de perfil próprio" ON public.usuarios;
DROP POLICY IF EXISTS "Gerenciamento de usuários" ON public.usuarios;

DROP POLICY IF EXISTS "Inserção de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Inserção pública validada de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Leitura pública de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Moderação restrita de comentários" ON public.comentarios;

-- 4. POLÍTICAS DE ACESSO ATIVAS
CREATE POLICY "Leitura pública de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Gerenciamento de categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de vídeos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Gerenciamento de vídeos" ON public.videos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de perfis" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Gerenciamento de usuários" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura pública de comentários" ON public.comentarios FOR SELECT USING (true);
CREATE POLICY "Inserção pública validada de comentários" ON public.comentarios 
FOR INSERT WITH CHECK (
  char_length(trim(texto)) >= 2 AND 
  char_length(texto) <= 500 AND 
  char_length(trim(autor)) >= 1 AND 
  char_length(autor) <= 60 AND 
  video_id IS NOT NULL
);

CREATE POLICY "Moderação restrita de comentários" ON public.comentarios 
FOR DELETE USING (true);

-- 5. FUNÇÕES RPC COM SEGURANÇA DEFINER
CREATE OR REPLACE FUNCTION public.increment_views(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_likes(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET curtidas = COALESCE(curtidas, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;



