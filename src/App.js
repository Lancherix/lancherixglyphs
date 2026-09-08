import { useState, useEffect, useRef } from "react";
import Reader from "./components/Reader";
import Generator from "./components/Generator";
import CornerMark from "./components/CornerMark";
import { API_BASE_URL } from "./config";
import "./App.css";
import symbol from './assets/symbolBlue.png';

// Render (free tier) duerme el backend tras inactividad; el primer
// request tras eso puede demorar bastante (cold start). En vez de
// que el usuario vea la app "viva" pero con /decode o /generate
// fallando o tardando una eternidad, pingueamos /health primero y
// mostramos el logo hasta que el servidor conteste.
const HEALTH_CHECK_INTERVAL_MS = 2000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;

export default function App() {
  const [tab, setTab] = useState("reader");
  const [serverReady, setServerReady] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function pingServer() {
      while (!cancelledRef.current) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            HEALTH_CHECK_TIMEOUT_MS
          );

          const response = await fetch(`${API_BASE_URL}/health`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            setServerReady(true);
            return;
          }
        } catch {
          // El servidor todavia esta despertando, o dio timeout el
          // health check. Se reintenta.
        }

        await new Promise((resolve) =>
          setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS)
        );
      }
    }

    pingServer();

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (!serverReady) {
    return (
      <div className="app-loading-screen">
        <img src={symbol} alt="Lancherix" className="app-loading-logo" />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <CornerMark size={22} />
        <span className="wordmark">Lancherix</span>
      </header>

      <nav className="tab-bar" role="tablist" aria-label="Secciones">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reader"}
          className={`tab ${tab === "reader" ? "tab-active" : ""}`}
          onClick={() => setTab("reader")}
        >
          Reader
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "generator"}
          className={`tab ${tab === "generator" ? "tab-active" : ""}`}
          onClick={() => setTab("generator")}
        >
          Generator
        </button>
      </nav>

      <main className="app-main">
        {tab === "reader" ? <Reader /> : <Generator />}
      </main>
    </div>
  );
}