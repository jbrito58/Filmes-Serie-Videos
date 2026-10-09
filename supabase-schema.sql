-- ====================================================================
-- PLATAFORMA LIVRE - SCRIPT SQL COMPLETO & DEFINITIVO PARA SUPABASE
-- Projeto: https://xfobtnfgapkteivwmiqw.supabase.co
-- Instruções:
-- 1. Acesse https://supabase.com/dashboard/project/xfobtnfgapkteivwmiqw
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Clique em "+ New query", cole todo este código e clique em "Run"
-- ====================================================================

-- Habilitar extensões necessárias para UUID e Criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. CRIAÇÃO DAS TABELAS (ORDEM ESTRITA DE DEPENDÊNCIA)
-- ====================================================================

-- 1.1 Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT '🍎',
  cor TEXT NOT NULL DEFAULT 'from-amber-500 to-yellow-400',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Tabela de Vídeos (Criada antes de qualquer política ou comentário)
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

-- 1.3 Tabela de Usuários / Perfis
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'creator', 'viewer')),
  avatar TEXT DEFAULT '🍌',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Tabela de Comentários / Mural Familiar (Depende de videos)
CREATE TABLE IF NOT EXISTS public.comentarios (
  id TEXT PRIMARY KEY DEFAULT ('com-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍓',
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. ÍNDICES DE PERFORMANCE E BUSCA RÁPIDA
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_videos_categoria ON public.videos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_videos_destaque ON public.videos(destaque);
CREATE INDEX IF NOT EXISTS idx_videos_visualizacoes ON public.videos(visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_video ON public.comentarios(video_id);

-- ====================================================================
-- 3. FUNÇÕES RPC (INCREMENTO ATÔMICO DE VIEWS E CURTIDAS)
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
-- 4. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- As tabelas já foram criadas acima, garantindo que não ocorra 42P01
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

-- Criação das políticas definitivas
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
-- 5. CONFIGURAÇÃO DO SUPABASE STORAGE (BUCKETS & PERMISSÕES)
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
  (
    'vid-1',
    'O Grande Show dos Alimentos: A Canção da Fruteira',
    'A turma toda se reuniu no palco principal da TV! O Morango canta, a Banana toca bateria e o Professor Brócolis ensina uma dança contagiante que faz todo mundo querer comer saudável.',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'cat-frutas',
    TRUE,
    142850,
    12430,
    '04:15',
    'Plataforma Livre',
    ARRAY['Frutas', 'Musical', 'Família', 'Destaque']
  ),
  (
    'vid-2',
    'Banana Bob na Selva dos Utensílios: A Busca pela Vitamina B6',
    'O destemido Bob, a banana exploradora com chapéu de safári, embarca numa expedição épica pela bancada da cozinha em busca da lendária colher de prata e do mistério do potássio!',
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'cat-frutas',
    FALSE,
    98400,
    8920,
    '03:40',
    'Plataforma Livre',
    ARRAY['Banana', 'Aventura', 'Exploração']
  ),
  (
    'vid-3',
    'Professor Brócolis no Laboratório: O Segredo da Super-Força Verde',
    'Com seus óculos redondinhos e tubo de ensaio, o sábio Professor Brócolis revela como o cálcio e as fibras protegem as defesas do nosso corpo como uma armadura invisível!',
    'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'cat-legumes',
    FALSE,
    112300,
    9840,
    '05:10',
    'Plataforma Livre',
    ARRAY['Brócolis', 'Ciência', 'Nutrição']
  ),
  (
    'vid-4',
    'Morangolina & O Festival Pop das Frutas Vermelhas',
    'A Morangolina soltou a voz no microfone prateado! Uma celebração cheia de ritmo, confete e lições sobre como os antioxidantes mantêm o coração feliz e forte.',
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'cat-frutas',
    FALSE,
    87520,
    7650,
    '02:55',
    'Plataforma Livre',
    ARRAY['Morango', 'Música', 'Dança']
  ),
  (
    'vid-5',
    'Cenoura Ninja: A Missão Noturna da Visão Perfeita',
    'A ágil Cenourinha salta pelas tábuas de corte para ensinar como a vitamina A ajuda os heróis a enxergarem no escuro e protegerem seus olhos das telas.',
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'cat-legumes',
    FALSE,
    65400,
    5410,
    '03:15',
    'Plataforma Livre',
    ARRAY['Cenoura', 'Ninja', 'Superpoderes']
  ),
  (
    'vid-6',
    'O Pãozinho Quentinho e o Queijinho Amigo: O Lanche Perfeito',
    'Um conto animado sobre harmonia alimentar! O Pão Integral e a fatia de queijo explicam a importância de equilibrar energia e proteínas antes da aula.',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    'cat-lanchinhos',
    FALSE,
    48900,
    4120,
    '04:02',
    'Plataforma Livre',
    ARRAY['Lanchinho', 'Pão', 'Amizade']
  ),
  (
    'vid-7',
    'Para Onde Vai a Água que Bebemos? Com a Gotinha de Laranja',
    'A fofa Laranjinha e sua amiga Gota de Água fazem uma viagem mágica pelo corpo humano para mostrar como nos manter hidratados traz energia para brincar o dia inteiro.',
    'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    'cat-curiosidades',
    FALSE,
    92100,
    8200,
    '04:45',
    'Plataforma Livre',
    ARRAY['Laranja', 'Hidratação', 'Ciência']
  ),
  (
    'vid-8',
    'O Bocejo da Abóbora: Historinha Relaxante para a Noite',
    'Depois de um dia agitado na horta, a doce Abóbora convida as crianças para respirar fundo, alongar os braços e ouvir o sussurro do vento entre as folhas.',
    'https://images.unsplash.com/photo-1508747703725-719777637510?w=1280&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'cat-historinhas',
    FALSE,
    74300,
    6890,
    '06:20',
    'Plataforma Livre',
    ARRAY['Sono', 'Relaxamento', 'Calmaria']
  )
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
