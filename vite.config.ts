import { sentryVitePlugin } from '@sentry/vite-plugin';
import { default as react } from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { checker } from 'vite-plugin-checker';

const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

const appVersion =
  process.env.VITE_APP_VERSION || process.env.VITE_SENTRY_RELEASE || 'dev';

const emitAppVersionPlugin = (): Plugin => ({
  name: 'emit-app-version',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ version: appVersion }),
    });
  },
});

export default defineConfig({
  base: '/shop-tools/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  build: {
    // Generate maps for Sentry upload only; do not expose them on GitHub Pages.
    sourcemap: uploadSourceMaps ? 'hidden' : false,
  },
  plugins: [
    react(),
    emitAppVersionPlugin(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}" --rule "no-console: off"',
      },
    }),
    ...(uploadSourceMaps
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
              name: process.env.VITE_SENTRY_RELEASE,
            },
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          }),
        ]
      : []),
  ],
});
