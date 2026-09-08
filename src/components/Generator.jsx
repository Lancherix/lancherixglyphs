import { useState } from "react";
import { API_BASE_URL } from "../config";

const MAX_LENGTH = 500;

export default function Generator() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const remaining = MAX_LENGTH - text.length;
  const isEmpty = text.trim().length === 0;

  async function handleGenerate() {
    if (isEmpty || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    // Libera el object URL anterior, si había uno, antes de pedir el
    // nuevo (evita acumular URLs "colgadas" en memoria).
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        let detail = `Error del servidor (${response.status})`;
        try {
          const data = await response.json();
          detail = data.detail || detail;
        } catch {
          // La respuesta no era JSON; usamos el detail por defecto.
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      setImageUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (error) {
      setErrorMessage(
        error.message || "No se pudo generar el código. Intentá de nuevo."
      );
      setStatus("error");
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "lancherix_code.png";
    link.click();
  }

  return (
    <div className="panel">
      <p className="panel-label">Crear un código</p>

      <label className="field-label" htmlFor="lancherix-input">
        Texto, link o lo que quieras codificar
      </label>

      <textarea
        id="lancherix-input"
        className="text-input"
        value={text}
        maxLength={MAX_LENGTH}
        onChange={(event) => setText(event.target.value)}
        placeholder="https://ejemplo.com, un mensaje, año, tildes, emojis 🎉…"
        rows={5}
      />

      <p className={`char-count ${remaining <= 20 ? "char-count-low" : ""}`}>
        {remaining} caracteres restantes
      </p>

      <div className="action-row">
        <button
          className="btn btn-primary"
          disabled={isEmpty || status === "loading"}
          onClick={handleGenerate}
          type="button"
        >
          {status === "loading" ? "Generando…" : "Generar código"}
        </button>

        {imageUrl && (
          <button className="btn btn-ghost" onClick={handleDownload} type="button">
            Descargar PNG
          </button>
        )}
      </div>

      {status === "error" && <p className="panel-error">{errorMessage}</p>}

      {imageUrl && (
        <div className="camera-frame">
          <img src={imageUrl} alt="Código generado" className="camera-media" />
        </div>
      )}
    </div>
  );
}
