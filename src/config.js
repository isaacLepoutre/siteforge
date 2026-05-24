/**
 * En local : proxy Node sur le port 3001
 * Sur Netlify : même domaine (""), les routes /api/* sont des fonctions serverless
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:3001" : "");
