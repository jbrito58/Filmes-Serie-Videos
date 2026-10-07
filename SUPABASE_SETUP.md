# 🍌 Plataforma Livre - Guia de Configuração & Deploy

Plataforma de streaming completa para publicar, organizar e assistir vídeos e animações criados com inteligência artificial.

---

## 🚀 1. Configuração do Supabase (Banco de Dados + Storage + Auth)

### Passo 1: Criar o Projeto no Supabase
1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto com o nome **"plataforma-livre"**.
3. Guarde sua senha do banco de dados com segurança.

### Passo 2: Executar o Script SQL no SQL Editor
No painel do Supabase, clique em **SQL Editor** no menu lateral, abra uma **New Query** e cole o seguinte script:

```sql
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

-- 4. Função para incremento de visualizações
CREATE OR REPLACE FUNCTION public.increment_views(video_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos
  SET visualizacoes = visualizacoes + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row Level Security (RLS)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Leitura pública de vídeos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de perfis" ON public.usuarios FOR SELECT USING (true);

CREATE POLICY "Gerenciar vídeos para criadores" ON public.videos FOR ALL USING (true);
CREATE POLICY "Gerenciar categorias" ON public.categorias FOR ALL USING (true);

-- 6. Storage Buckets (Armazenamento de Vídeos e Thumbnails)
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso público aos vídeos" ON storage.objects FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));
CREATE POLICY "Upload público de mídias" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('videos', 'thumbnails'));
```

### Passo 3: Obter as Chaves de Conexão
1. No menu do Supabase, clique em **Project Settings** > **API**.
2. Copie:
   - **Project URL** (ex: `https://xyzabcdefg.supabase.co`)
   - **anon public key** (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`)

---

## ⚡ 2. Conectar na Aplicação

Você pode conectar o Supabase de duas maneiras:

### Opção A: Pelo Painel Administrativo da Aplicação
1. Acesse o **Painel Admin** na barra superior da aplicação.
2. Acesse a aba **"Supabase & Deploy"**.
3. Cole sua **Project URL** e sua **Anon Key** e clique em **"Salvar Conexão"**. A aplicação se conectará instantaneamente!

### Opção B: Via Variáveis de Ambiente (`.env`)
Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
```

---

## 🌐 3. Instruções de Deploy na Vercel

1. Envie o código para o seu repositório no **GitHub** ou **GitLab**.
2. Acesse [https://vercel.com](https://vercel.com) e clique em **Add New... > Project**.
3. Selecione o repositório **plataforma-livre**.
4. A Vercel detectará o projeto automaticamente como Vite SPA.
5. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY`: sua chave Anon do Supabase
6. Clique em **Deploy**! Em menos de 1 minuto seu streaming estará online no mundo todo.
