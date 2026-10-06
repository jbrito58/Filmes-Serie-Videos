export interface Video {
  id: string;
  titulo: string;
  descricao: string;
  thumbnail: string;
  video_url: string;
  categoria_id: string;
  destaque: boolean;
  visualizacoes: number;
  curtidas?: number;
  duracao?: string;
  created_at: string;
  autor?: string;
  tags?: string[];
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone: string;
  cor: string;
  created_at?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'creator' | 'viewer';
  avatar?: string;
}

export interface Comentario {
  id: string;
  video_id: string;
  autor: string;
  emoji: string;
  texto: string;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}
