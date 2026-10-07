import heroImg from '../assets/images/hero_alimentos_falantes_1791312401082.jpg';
import bananaImg from '../assets/images/thumb_banana_aventura_1791312410252.jpg';
import brocolisImg from '../assets/images/thumb_brocolis_genio_1791312421060.jpg';
import morangoImg from '../assets/images/thumb_moranguinho_festa_1791312430945.jpg';
import { Categoria, Video } from '../types';

export const INITIAL_CATEGORIES: Categoria[] = [
  {
    id: 'cat-frutas',
    nome: 'Frutas Falantes',
    slug: 'frutas',
    descricao: 'Aventuras doces e divertidas com as frutas mais animadas da quitanda!',
    icone: '🍌',
    cor: 'from-amber-500 to-yellow-400',
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cat-legumes',
    nome: 'Legumes Heróis',
    slug: 'legumes',
    descricao: 'Superpoderes verdes e saudáveis com brócolis, cenouras e muito mais.',
    icone: '🥦',
    cor: 'from-emerald-500 to-green-400',
    created_at: '2026-01-10T10:05:00Z'
  },
  {
    id: 'cat-lanchinhos',
    nome: 'Lanchinhos Divertidos',
    slug: 'lanchinhos',
    descricao: 'Receitinhas mágicas, pãozinhos felizes e sucos coloridos.',
    icone: '🥪',
    cor: 'from-orange-500 to-amber-400',
    created_at: '2026-01-10T10:10:00Z'
  },
  {
    id: 'cat-curiosidades',
    nome: 'Ciência & Nutrição',
    slug: 'nutricao',
    descricao: 'Descubra para onde vão as vitaminas e por que comer bem faz crescer forte!',
    icone: '🔬',
    cor: 'from-cyan-500 to-blue-400',
    created_at: '2026-01-10T10:15:00Z'
  },
  {
    id: 'cat-historinhas',
    nome: 'Historinhas da Cozinha',
    slug: 'historinhas',
    descricao: 'Contos relaxantes e fábulas cantadas para a hora do lanche ou do soninho.',
    icone: '✨',
    cor: 'from-purple-500 to-pink-400',
    created_at: '2026-01-10T10:20:00Z'
  }
];

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    titulo: 'O Grande Show dos Alimentos Falantes: A Canção da Fruteira',
    descricao: 'A turma toda se reuniu no palco principal da TV! O Morango canta, a Banana toca bateria e o Professor Brócolis ensina uma dança contagiante que faz todo mundo querer comer saudável.',
    thumbnail: heroImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    categoria_id: 'cat-frutas',
    destaque: true,
    visualizacoes: 142850,
    curtidas: 12430,
    duracao: '04:15',
    created_at: '2026-03-28T14:30:00Z',
    autor: 'Estúdio Plataforma Livre',
    tags: ['Frutas', 'Musical', 'Família', 'Destaque']
  },
  {
    id: 'vid-2',
    titulo: 'Banana Bob na Selva dos Utensílios: A Busca pela Vitamina B6',
    descricao: 'O destemido Bob, a banana exploradora com chapéu de safári, embarca numa expedição épica pela bancada da cozinha em busca da lendária colher de prata e do mistério do potássio!',
    thumbnail: bananaImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    categoria_id: 'cat-frutas',
    destaque: false,
    visualizacoes: 98400,
    curtidas: 8920,
    duracao: '03:40',
    created_at: '2026-03-25T11:20:00Z',
    autor: 'Chef Animador IA',
    tags: ['Banana', 'Aventura', 'Exploração']
  },
  {
    id: 'vid-3',
    titulo: 'Professor Brócolis no Laboratório: O Segredo da Super-Força Verde',
    descricao: 'Com seus óculos redondinhos e tubo de ensaio, o sábio Professor Brócolis revela como o cálcio e as fibras protegem as defesas do nosso corpo como uma armadura invisível!',
    thumbnail: brocolisImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    categoria_id: 'cat-legumes',
    destaque: false,
    visualizacoes: 112300,
    curtidas: 9840,
    duracao: '05:10',
    created_at: '2026-03-22T09:15:00Z',
    autor: 'Laboratório NutriKids',
    tags: ['Brócolis', 'Ciência', 'Nutrição']
  },
  {
    id: 'vid-4',
    titulo: 'Morangolina & O Festival Pop das Frutas Vermelhas',
    descricao: 'A Morangolina soltou a voz no microfone prateado! Uma celebração cheia de ritmo, confete e lições sobre como os antioxidantes mantêm o coração feliz e forte.',
    thumbnail: morangoImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    categoria_id: 'cat-frutas',
    destaque: false,
    visualizacoes: 87520,
    curtidas: 7650,
    duracao: '02:55',
    created_at: '2026-03-20T16:45:00Z',
    autor: 'Estúdio Plataforma Livre',
    tags: ['Morango', 'Música', 'Dança']
  },
  {
    id: 'vid-5',
    titulo: 'Cenoura Ninja: A Missão Noturna da Visão Perfeita',
    descricao: 'A ágil Cenourinha salta pelas tábuas de corte para ensinar como a vitamina A ajuda os heróis a enxergarem no escuro e protegerem seus olhos das telas.',
    thumbnail: heroImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    categoria_id: 'cat-legumes',
    destaque: false,
    visualizacoes: 65400,
    curtidas: 5410,
    duracao: '03:15',
    created_at: '2026-03-15T10:00:00Z',
    autor: 'Sensei Legumes',
    tags: ['Cenoura', 'Ninja', 'Superpoderes']
  },
  {
    id: 'vid-6',
    titulo: 'O Pãozinho Quentinho e o Queijinho Amigo: O Lanche Perfeito',
    descricao: 'Um conto animado sobre harmonia alimentar! O Pão Integral e a fatia de queijo explicam a importância de equilibrar energia e proteínas antes da aula.',
    thumbnail: bananaImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    categoria_id: 'cat-lanchinhos',
    destaque: false,
    visualizacoes: 48900,
    curtidas: 4120,
    duracao: '04:02',
    created_at: '2026-03-10T13:30:00Z',
    autor: 'Padaria Encantada',
    tags: ['Lanchinho', 'Pão', 'Amizade']
  },
  {
    id: 'vid-7',
    titulo: 'Para Onde Vai a Água que Bebemos? Com a Gotinha de Laranja',
    descricao: 'A fofa Laranjinha e sua amiga Gota de Água fazem uma viagem mágica pelo corpo humano para mostrar como nos manter hidratados traz energia para brincar o dia inteiro.',
    thumbnail: brocolisImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    categoria_id: 'cat-curiosidades',
    destaque: false,
    visualizacoes: 92100,
    curtidas: 8200,
    duracao: '04:45',
    created_at: '2026-03-05T08:20:00Z',
    autor: 'Laboratório NutriKids',
    tags: ['Laranja', 'Hidratação', 'Ciência']
  },
  {
    id: 'vid-8',
    titulo: 'O Bocejo da Abóbora: Historinha Relaxante para a Noite',
    descricao: 'Depois de um dia agitado na horta, a doce Abóbora convida as crianças para respirar fundo, alongar os braços e ouvir o sussurro do vento entre as folhas.',
    thumbnail: morangoImg,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    categoria_id: 'cat-historinhas',
    destaque: false,
    visualizacoes: 74300,
    curtidas: 6890,
    duracao: '06:20',
    created_at: '2026-02-28T19:00:00Z',
    autor: 'Contos da Terra',
    tags: ['Sono', 'Relaxamento', 'Calmaria']
  }
];
