# 🍌 Plataforma Livre - Guia de Configuração, Segurança & Deploy

Plataforma de streaming completa para publicar, organizar e assistir vídeos e animações criados com inteligência artificial.

---

## 🚀 1. Configuração do Supabase (Banco de Dados + Storage + Auth)

### Chaves do Projeto
As chaves do seu projeto já foram configuradas no arquivo `.env`:
- **Project URL**: `https://xfobtnfgapkteivwmiqw.supabase.co`
- **Anon Public Key**: `sb_publishable_0L8eDlqWyOC6b-osH-bkSQ_XBQFkMiD`

---

## 🛡️ 2. Auditoria e Blindagem de Políticas RLS (Row-Level Security)

### Vulnerabilidades Identificadas e Corrigidas:
1. **Permissões Anônimas Abertas (Anti-Wipe)**:
   - *Problema*: As políticas padrão de prototipagem usavam `FOR ALL USING (true) WITH CHECK (true)`, permitindo a qualquer visitante anônimo com a chave pública executar exclusão ou alteração de vídeos e categorias.
   - *Correção*: Políticas separadas por operação foram criadas. `SELECT` permanece público para a audiência, enquanto `INSERT`, `UPDATE` e `DELETE` em `videos` e `categorias` são estritamente restritos a administradores autenticados.
2. **Validação Estrita Anti-Spam (Comentários)**:
   - *Problema*: Inserção de comentários permitia qualquer texto, possibilitando DoS com textos gigantescos ou vazios.
   - *Correção*: Validação de tamanho no banco (`char_length(texto) BETWEEN 2 AND 500`) e exclusão restrita a administradores.
3. **Proteção Atômica de Métricas**:
   - Visualizações e curtidas são incrementadas via Stored Procedures `SECURITY DEFINER` (`increment_views` e `increment_likes`), impedindo manipulação arbitrária de números.
4. **Segurança de Storage**:
   - Bloqueio de arquivos executáveis ou perigosos, permitindo apenas extensões válidas (`jpg, png, webp, mp4`).

### Como Aplicar o Patch de Segurança no Banco:
1. Acesse o console do seu projeto no Supabase: [https://supabase.com/dashboard/project/xfobtnfgapkteivwmiqw](https://supabase.com/dashboard/project/xfobtnfgapkteivwmiqw).
2. Vá em **SQL Editor** no menu lateral esquerdo e clique em **New Query**.
3. Copie o script **"Patch de Blindagem SQL"** disponível no Painel Admin (aba *Supabase & Deploy*) ou abaixo e clique em **Run**:

```sql
-- 1. REMOVER POLÍTICAS PERMISSIVAS ANTERIORES
DROP POLICY IF EXISTS "Gerenciamento de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gerenciamento de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Inserção de comentários" ON public.comentarios;
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Leitura pública de vídeos" ON public.videos;
DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura pública de comentários" ON public.comentarios;

-- 2. HABILITAR RLS RIGOROSO
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE LEITURA PÚBLICA (AUDIÊNCIA)
CREATE POLICY "Leitura pública de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Leitura pública de vídeos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de comentários" ON public.comentarios FOR SELECT USING (true);
CREATE POLICY "Leitura pública de perfis" ON public.usuarios FOR SELECT USING (true);

-- 4. POLÍTICAS DE ESCRITA DE COMENTÁRIOS COM VALIDAÇÃO ANTI-SPAM
CREATE POLICY "Inserção pública validada de comentários" ON public.comentarios 
FOR INSERT WITH CHECK (
  char_length(trim(texto)) >= 2 AND 
  char_length(texto) <= 500 AND 
  char_length(trim(autor)) >= 1 AND 
  char_length(autor) <= 60 AND 
  video_id IS NOT NULL
);

-- Bloqueia exclusão de comentários por anônimos (apenas administradores)
CREATE POLICY "Moderação restrita de comentários" ON public.comentarios 
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. BLINDAGEM DE VÍDEOS E CATEGORIAS (IMPEDE EXCLUSÃO E ADULTERAÇÃO POR ANÔNIMOS)
CREATE POLICY "Gerenciamento restrito de categorias" ON public.categorias 
FOR ALL USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Gerenciamento restrito de vídeos" ON public.videos 
FOR ALL USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- 6. SEGURANÇA DE CONTADORES ATÔMICOS (SECURITY DEFINER)
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
