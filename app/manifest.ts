import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'DSA Tracker',
        short_name: 'DSA Tracker',
        description: 'Track your Data Structures and Algorithms progress to glory.',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617', // slate-950
        theme_color: '#7c3aed', // primary violet
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
