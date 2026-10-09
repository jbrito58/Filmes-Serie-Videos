/**
 * Módulo de Segurança e Sanitização - Plataforma Livre
 * Proteção contra OWASP Top 10 (XSS, Injection, Insecure Direct References, Malicious URIs)
 */

/**
 * Valida se uma URL é segura para navegação, renderização de imagem ou streaming de vídeo.
 * Bloqueia protocolos perigosos como javascript:, data:text/html, vbscript:, file:, etc.
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  
  // Bloqueio rigoroso de injeção de script via protocolo
  if (
    clean.startsWith('javascript:') ||
    clean.startsWith('data:text/html') ||
    clean.startsWith('vbscript:') ||
    clean.startsWith('file:')
  ) {
    return false;
  }

  // Permitir apenas protocolos seguros
  return (
    clean.startsWith('https://') ||
    clean.startsWith('http://') ||
    clean.startsWith('blob:') ||
    clean.startsWith('data:image/') ||
    clean.startsWith('/')
  );
}

/**
 * Retorna uma URL segura ou um fallback limpo caso seja inválida ou perigosa.
 */
export function sanitizeSafeUrl(url: string | undefined | null, fallback = ''): string {
  if (!url) return fallback;
  if (!isSafeUrl(url)) {
    console.warn('URL insegura bloqueada pelo filtro de segurança:', url);
    return fallback;
  }
  return url.trim();
}

/**
 * Sanitiza texto removendo tags HTML não autorizadas e limitando tamanho máximo.
 */
export function sanitizeText(input: string | undefined | null, maxLength = 500): string {
  if (!input) return '';
  // Remove tags HTML
  const noHtml = input.replace(/<[^>]*>?/gm, '');
  // Normaliza espaços em branco e aplica limite de caracteres
  return noHtml.trim().slice(0, maxLength);
}

/**
 * Sanitiza slug para categorias e URLs amigáveis.
 */
export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-') // substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // remove hífens no início e fim
    .slice(0, 50);
}

/**
 * Validação rigorosa de dados de entrada para comentários.
 */
export function validateCommentInput(comment: { autor: string; emoji: string; texto: string }): { 
  isValid: boolean; 
  error?: string;
  sanitized: { autor: string; emoji: string; texto: string };
} {
  const sanitizedAutor = sanitizeText(comment.autor, 60);
  const sanitizedTexto = sanitizeText(comment.texto, 500);
  const sanitizedEmoji = sanitizeText(comment.emoji, 8) || '✨';

  if (!sanitizedTexto || sanitizedTexto.length < 2) {
    return {
      isValid: false,
      error: 'O comentário deve conter pelo menos 2 caracteres.',
      sanitized: { autor: sanitizedAutor, emoji: sanitizedEmoji, texto: sanitizedTexto }
    };
  }

  if (sanitizedTexto.length > 500) {
    return {
      isValid: false,
      error: 'O comentário não pode ultrapassar 500 caracteres.',
      sanitized: { autor: sanitizedAutor, emoji: sanitizedEmoji, texto: sanitizedTexto }
    };
  }

  return {
    isValid: true,
    sanitized: {
      autor: sanitizedAutor || 'Fã dos Alimentos',
      emoji: sanitizedEmoji,
      texto: sanitizedTexto
    }
  };
}

/**
 * Validação rigorosa de metadados de vídeo antes de persistir no banco de dados.
 */
export function validateVideoInput(video: {
  titulo: string;
  descricao: string;
  video_url: string;
  thumbnail: string;
}): { isValid: boolean; error?: string } {
  const tit = sanitizeText(video.titulo, 150);
  if (!tit || tit.length < 3) {
    return { isValid: false, error: 'O título do vídeo deve ter no mínimo 3 caracteres.' };
  }

  const desc = sanitizeText(video.descricao, 2000);
  if (!desc || desc.length < 5) {
    return { isValid: false, error: 'A descrição deve ter no mínimo 5 caracteres.' };
  }

  if (!isSafeUrl(video.video_url)) {
    return { isValid: false, error: 'A URL do vídeo deve ser um link válido e seguro (https:// ou http://).' };
  }

  if (!isSafeUrl(video.thumbnail)) {
    return { isValid: false, error: 'A URL da thumbnail deve ser um link válido e seguro (https:// ou http://).' };
  }

  return { isValid: true };
}
