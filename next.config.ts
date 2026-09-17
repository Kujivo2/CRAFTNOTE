import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le navigateur ne parle jamais a Firestore (7.2) : l'Admin SDK reste cote serveur.
  serverExternalPackages: ['firebase-admin'],
  headers: async () => [
    {
      source: '/:chemin*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
