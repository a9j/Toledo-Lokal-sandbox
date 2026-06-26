import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (empty prefix) so we can read the NEXT_PUBLIC_* feature
  // flags, which Vite would otherwise ignore (it only exposes VITE_*).
  const env = loadEnv(mode, process.cwd(), "");

  // Accept either VITE_* (what this codebase originally wanted) or NEXT_PUBLIC_*
  // (what the Supabase ↔ Vercel integration sets by default). That way the
  // build picks up whichever names are already in Vercel without a rename.
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";

  return {
  define: {
    __NEXT_PUBLIC_LP_ENABLED__: JSON.stringify(env.NEXT_PUBLIC_LP_ENABLED ?? ""),
    __NEXT_PUBLIC_HOME_VARIANT__: JSON.stringify(env.NEXT_PUBLIC_HOME_VARIANT ?? ""),
    __NEXT_PUBLIC_TODAY_TAB_ENABLED__: JSON.stringify(env.NEXT_PUBLIC_TODAY_TAB_ENABLED ?? ""),
    // Accept either VITE_* or NEXT_PUBLIC_* so the build picks up whichever name
    // is set in Vercel, matching the supabase var handling above.
    __BETA_WINDOW_ENABLED__: JSON.stringify(env.VITE_BETA_WINDOW_ENABLED ?? env.NEXT_PUBLIC_BETA_WINDOW_ENABLED ?? ""),
    __SUPABASE_URL__: JSON.stringify(supabaseUrl),
    __SUPABASE_KEY__: JSON.stringify(supabaseKey),
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
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/react-router-dom')) return 'vendor-router';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('node_modules/@supabase/supabase-js')) return 'vendor-supabase';
          if (
            id.includes('node_modules/@radix-ui/react-dialog') ||
            id.includes('node_modules/@radix-ui/react-dropdown-menu') ||
            id.includes('node_modules/@radix-ui/react-tabs') ||
            id.includes('node_modules/@radix-ui/react-tooltip') ||
            id.includes('node_modules/@radix-ui/react-popover') ||
            id.includes('node_modules/@radix-ui/react-select')
          ) return 'ui-radix';
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
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: null,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
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
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60,
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