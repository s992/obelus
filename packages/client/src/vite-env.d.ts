/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly OBELUS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
