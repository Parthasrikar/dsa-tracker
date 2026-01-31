'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => console.log('SW registered'))
                .catch((err) => console.error('SW registration failed', err));
        }
    }, []);

    return null;
}
