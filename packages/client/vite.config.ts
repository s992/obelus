import formatjs from '@formatjs/unplugin/vite';
import babel from '@rolldown/plugin-babel';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { createJiti } from 'jiti';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

const jiti = createJiti(import.meta.url);
const { env: envSchema } = (await jiti.import('@obelus/shared/schema')) as typeof import('@obelus/shared/schema');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', '');
  const parsed = envSchema.parse(env);

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
    envDir: '../..',
    define: {
      'import.meta.env.OBELUS_BASE_URL': JSON.stringify(parsed.OBELUS_BASE_URL),
    },
  };
});
