import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Card Scorekeeper',
    short_name: 'Scorekeeper',
    description: 'Keep score for bid-based card games with friends, live across every phone.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
