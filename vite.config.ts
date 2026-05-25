import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (empty prefix) so we can read the NEXT_PUBLIC_* feature
  // flags, which Vite would otherwise ignore (it only exposes VITE_*).
  const env = loadEnv(mode, process.cwd(), "");

  return {
  define: {
    __NEXT_PUBLIC_LP_ENABLED__: JSON.stringify(env.NEXT_PUBLIC_LP_ENABLED ?? ""),
    __NEXT_PUBLIC_HOME_VARIANT__: JSON.stringify(env.NEXT_PUBLIC_HOME_VARIANT ?? ""),
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: 'script-defer',
      includeAssets: ["favicon.png", "placeholder.svg"],
      manifest: {
        name: "ToledoLokal",
        short_name: "ToledoLokal",
        description: "Discover the Glass City - Local businesses, events, and community",
        theme_color: "#0A0F1E",
        background_color: "#0A0F1E",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        navigateFallback: null, // Don't cache navigation requests
        runtimeCaching: [
          {
            // Never cache Supabase auth/API calls
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});