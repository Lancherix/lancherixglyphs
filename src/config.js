// Backend base URL.
//
// Local dev default: http://localhost:8000 (matches `uvicorn main:app
// --port 8000` from the backend README).
//
// In production, set VITE_API_BASE_URL in your build environment
// (e.g. Vercel/Netlify env vars, or a .env.production file with
// Vite) to your Render URL, e.g.:
//     VITE_API_BASE_URL=https://lancherix-backend.onrender.com
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://lancherixglyphs-backend.onrender.com";
