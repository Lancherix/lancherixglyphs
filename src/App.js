import { useState } from "react";
import Reader from "./components/Reader";
import Generator from "./components/Generator";
import CornerMark from "./components/CornerMark";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("reader");

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
