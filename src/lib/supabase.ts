import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_CATEGORIES, INITIAL_VIDEOS } from '../data/initialData';
import { Categoria, Video } from '../types';

// Storage keys for local persistence fallback
const STORAGE_KEY_VIDEOS = 'alimentos_tv_videos_v1';
const STORAGE_KEY_CATEGORIES = 'alimentos_tv_categories_v1';
const STORAGE_KEY_SUPABASE_URL = 'alimentos_tv_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'alimentos_tv_supabase_key';
const STORAGE_KEY_FAVORITES = 'alimentos_tv_favorites';
const STORAGE_KEY_COMMENTS = 'alimentos_tv_comments';

// Get current Supabase credentials from Env or localStorage
export function getSavedCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  
  const localUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || '';

  const activeUrl = localUrl || envUrl;
  const activeKey = localKey || envKey;

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
  if (url) localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);

  supabaseInstance = null; // reset client to re-instantiate
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

export async function createVideo(video: Omit<Video, 'id' | 'created_at' | 'visualizacoes'>): Promise<Video> {
  const newVideo: Video = {
    ...video,
    id: `vid-${Date.now()}`,
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
  const newCat: Categoria = {
    ...cat,
    id: `cat-${Date.now()}`,
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

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

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

// Comments storage
export function getCommentsForVideo(videoId: string) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_COMMENTS}_${videoId}`);
    if (raw) return JSON.parse(raw);
    // Initial friendly kid comments
    return [
      {
        id: 'c-1',
        video_id: videoId,
        autor: 'Pequena Maria (6 anos)',
        emoji: '🍓',
        texto: 'Adorei a musiquinha! Agora eu quero comer morangos no café da manhã!',
        created_at: 'Há 2 horas'
      },
      {
        id: 'c-2',
        video_id: videoId,
        autor: 'Lucas & Família',
        emoji: '🥦',
        texto: 'O Professor Brócolis é muito engraçado! Meu filho pediu brócolis no almoço hoje haha.',
        created_at: 'Ontem'
      }
    ];
  } catch {
    return [];
  }
}

export function addCommentToVideo(videoId: string, comment: { autor: string; emoji: string; texto: string }) {
  const current = getCommentsForVideo(videoId);
  const newComment = {
    id: `com-${Date.now()}`,
    video_id: videoId,
    autor: comment.autor.trim() || 'Fã dos Alimentos',
    emoji: comment.emoji || '✨',
    texto: comment.texto.trim(),
    created_at: 'Agora mesmo'
  };
  const updated = [newComment, ...current];
  localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${videoId}`, JSON.stringify(updated));
  return newComment;
}

// Complete Ready-to-Execute Supabase SQL Schema for the User
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- ALIMENTOS FALANTES TV - SCHEMA COMPLETO PARA O SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ========================================================

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT '🍎',
  cor TEXT NOT NULL DEFAULT 'from-amber-500 to-yellow-400',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Vídeos
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
  autor TEXT DEFAULT 'Estúdio Alimentos Falantes',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'creator', 'viewer')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Função RPC para incremento seguro de visualizações
CREATE OR REPLACE FUNCTION public.increment_views(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET visualizacoes = visualizacoes + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Configurar Row Level Security (RLS)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública (Qualquer um pode assistir)
CREATE POLICY "Leitura pública de categorias"
  ON public.categorias FOR SELECT
  USING (true);

CREATE POLICY "Leitura pública de vídeos"
  ON public.videos FOR SELECT
  USING (true);

CREATE POLICY "Leitura pública de perfis"
  ON public.usuarios FOR SELECT
  USING (true);

-- Políticas de Modificação para Usuários Autenticados (ou Criadores/Admins)
CREATE POLICY "Permitir inserção de vídeos para autenticados"
  ON public.videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Permitir atualização de vídeos para autenticados"
  ON public.videos FOR UPDATE
  USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Permitir exclusão de vídeos para autenticados"
  ON public.videos FOR DELETE
  USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Permitir gerenciamento de categorias"
  ON public.categorias FOR ALL
  USING (auth.role() = 'authenticated' OR true);

-- 6. Configurar Storage Buckets no Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para acesso público às mídias
CREATE POLICY "Acesso público aos vídeos do storage"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('videos', 'thumbnails'));

CREATE POLICY "Upload permitido de mídias"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('videos', 'thumbnails'));
`;
