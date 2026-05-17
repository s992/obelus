import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/migrate.ts'],
  format: ['cjs'],
  shims: true,
  noExternal: ['@obelus/shared'],
});
