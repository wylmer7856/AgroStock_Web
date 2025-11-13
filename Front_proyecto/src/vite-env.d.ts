/// <reference types="vite/client" />

// Definir los tipos para las variables de entorno
interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  
  // Variables de entorno personalizadas
  readonly VITE_API_URL?: string;
  readonly VITE_ENABLE_MOCK?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}



