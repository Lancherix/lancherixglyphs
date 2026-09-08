import { useEffect, useRef, useState } from "react";
import CornerMark from "./CornerMark";
import { API_BASE_URL } from "../config";

// Estados posibles de la cámara:
//   idle        -> apagada (usuario la pausó, o venimos de subir un archivo)
//   starting    -> pidiendo permiso / abriendo el stream
//   live        -> mostrando video en vivo
//   denied      -> el usuario negó el permiso, o falló al abrir
//   unsupported -> el navegador no soporta getUserMedia
export default function Reader() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState("idle");
  const [capturedImage, setCapturedImage] = useState(null);

  // Estado de la decodificación contra el backend:
  //   idle | decoding | done | error
  const [decodeStatus, setDecodeStatus] = useState("idle");
  const [decodedText, setDecodedText] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const [debugImages, setDebugImages] = useState([]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apenas hay una imagen capturada o subida, se manda a decodificar
  // automáticamente contra el backend.
  useEffect(() => {
    if (capturedImage) {
      decodeImage(capturedImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      return;
    }

    setCameraStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus("live");
    } catch (error) {
      setCameraStatus("denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraStatus !== "live") return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL("image/png"));
    stopCamera();
  }

  function retake() {
    setCapturedImage(null);
    setDecodeStatus("idle");
    setDecodedText("");
    setDecodeError("");
    setDebugImages([]);
    startCamera();
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setCameraStatus("idle");
      setCapturedImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Permite volver a elegir el mismo archivo si el usuario lo desea.
    event.target.value = "";
  }

    async function decodeImage(dataUrl) {
    setDecodeStatus("decoding");
    setDecodedText("");
    setDecodeError("");
    setDebugImages([]);

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, "capture.png");

      const response = await fetch(`${API_BASE_URL}/decode`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Las fotos de debug se guardan aunque haya habido un error,
      // asi el usuario puede ver hasta donde llego el pipeline.
      setDebugImages(data.images || []);

      if (!response.ok || data.error) {
        setDecodeError(
          data.error || `Error del servidor (${response.status})`
        );
        setDecodeStatus("error");
        return;
      }

      setDecodedText(data.text);
      setDecodeStatus("done");
    } catch (error) {
      setDecodeError(
        error.message || "No se pudo conectar con el servidor de decodificación."
      );
      setDecodeStatus("error");
    }
  }

  async function copyDecodedText() {
    if (!decodedText) return;
    try {
      await navigator.clipboard.writeText(decodedText);
    } catch {
      // Falla silenciosa: el navegador puede negar el permiso de
      // portapapeles; no es crítico para el flujo principal.
    }
  }

  function downloadAllDebugImages() {
    debugImages.forEach((img) => {
      const link = document.createElement("a");
      link.href = img.data;
      link.download = img.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  return (
    <div className="panel">
      <p className="panel-label">Leer un código</p>

      <div className="camera-frame">
        {capturedImage ? (
          <img src={capturedImage} alt="Foto capturada" className="camera-media" />
        ) : (
          <>
            <video
              ref={videoRef}
              className="camera-media"
              playsInline
              muted
              hidden={cameraStatus !== "live"}
            />

            {cameraStatus === "starting" && (
              <div className="camera-message">
                <CornerMark size={26} />
                <p>Activando la cámara…</p>
              </div>
            )}

            {cameraStatus === "denied" && (
              <div className="camera-message">
                <p>No pudimos acceder a la cámara.</p>
                <button className="btn btn-ghost" onClick={startCamera} type="button">
                  Intentar de nuevo
                </button>
              </div>
            )}

            {cameraStatus === "unsupported" && (
              <div className="camera-message">
                <p>Este navegador no permite acceso a la cámara. Subí una foto en su lugar.</p>
              </div>
            )}

            {cameraStatus === "idle" && (
              <div className="camera-message">
                <p>Cámara en pausa.</p>
                <button className="btn btn-ghost" onClick={startCamera} type="button">
                  Activar cámara
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="action-row">
        {capturedImage ? (
          <button className="btn btn-primary" onClick={retake} type="button">
            Volver a intentar
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={capturePhoto}
            disabled={cameraStatus !== "live"}
            type="button"
          >
            Tomar foto
          </button>
        )}

        <button
          className="btn btn-ghost"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Subir una foto
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          hidden
        />
      </div>

      {decodeStatus === "decoding" && (
        <p className="panel-status">Decodificando…</p>
      )}

      {decodeStatus === "error" && (
        <p className="panel-error">{decodeError}</p>
      )}

      {decodeStatus === "done" && (
        <div className="result-box">
          <p className="field-label">Texto decodificado</p>
          <p className="result-text">{decodedText}</p>
          <div className="action-row">
            <button className="btn btn-ghost" onClick={copyDecodedText} type="button">
              Copiar
            </button>
          </div>
        </div>
      )}

      {debugImages.length > 0 && (
        <div className="debug-gallery">
          <div className="debug-gallery-header">
            <p className="field-label">Fotos generadas por el pipeline</p>
            <button
              className="btn btn-ghost"
              onClick={downloadAllDebugImages}
              type="button"
            >
              Descargar todas
            </button>
          </div>
          <div className="debug-gallery-grid">
            ...
          </div>
        </div>
      )}

      <canvas ref={canvasRef} hidden />
    </div>
  );
}
