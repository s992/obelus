import path from 'node:path';
import formatjs from '@formatjs/unplugin/vite';
import babel from '@rolldown/plugin-babel';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig(() => {
  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: false,
      }),
      vanillaExtractPlugin(),
      formatjs({
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      svgr(),
      devtools(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    envDir: '../..',
  };
});
