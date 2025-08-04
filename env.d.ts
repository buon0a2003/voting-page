/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_INFURA_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
