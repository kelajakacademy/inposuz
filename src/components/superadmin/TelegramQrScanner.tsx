import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle2, QrCode, ShieldCheck, Sparkles, XCircle, RefreshCw } from "lucide-react";

export const TelegramQrScanner: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("📷 Камера очилмоқда... QR-кодни кўрсатинг");
  const [manualCode, setManualCode] = useState("");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.warn("Webcam access failed", err);
      setMessage("Камерага рухсат берилмади. QR-кодни пастга қўлда киритишингиз мумкин.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const tick = () => {
    if (isProcessingRef.current) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });

          if (code && code.data) {
            isProcessingRef.current = true;
            handleProcessQrCode(code.data);
            return;
          }
        }
      }
    }

    requestAnimationFrame(tick);
  };

  const handleProcessQrCode = async (rawText: string) => {
    if (!rawText) return;
    setStatus("scanning");
    setMessage("⏳ QR-код текширилмоқда...");

    let sessionId = rawText.trim();
    if (sessionId.includes("start=")) {
      sessionId = sessionId.split("start=")[1] || sessionId;
    }
    if (sessionId.includes("auth_qr_")) {
      sessionId = "auth_qr_" + sessionId.split("auth_qr_")[1];
    }

    try {
      const res = await fetch("/api/superadmin/approve-qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          username: "khayitov099"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("✅ Браузерда CRM сайтига кириш муваффақиятли тасдиқланди!");
        stopWebcam();
        setTimeout(() => {
          (window as any).Telegram?.WebApp?.close();
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.message || "❌ QR-код сессияси топилмади ёки муддати ўтган.");
        setTimeout(() => {
          isProcessingRef.current = false;
          setStatus("idle");
          requestAnimationFrame(tick);
        }, 3000);
      }
    } catch (err) {
      setStatus("error");
      setMessage("❌ Сервер билан боғланишда хатолик.");
      setTimeout(() => {
        isProcessingRef.current = false;
        setStatus("idle");
        requestAnimationFrame(tick);
      }, 3000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      isProcessingRef.current = true;
      handleProcessQrCode(manualCode);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121820] text-white flex flex-col items-center justify-center p-5 font-sans select-none">
      <div className="w-full max-w-md bg-[#1C2533] border border-blue-500/30 rounded-2xl shadow-2xl p-6 text-center space-y-5">
        {/* HEADER */}
        <div className="space-y-1">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center text-xl font-bold shadow-md">
            🤖
          </div>
          <h1 className="text-base font-black text-white flex items-center justify-center gap-1.5 pt-1">
            <span>iNPOS Auth Bot Scanner</span>
          </h1>
          <p className="text-[11px] text-gray-400">
            CRM Камера QR-код Сканери
          </p>
        </div>

        {/* WEBCAM CAMERA CANVAS DISPLAY */}
        <div className="relative w-full aspect-square max-w-[260px] mx-auto bg-black rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* SCANNER OVERLAY FRAME */}
          <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
            <div className="w-full h-0.5 bg-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-bounce" />
          </div>
        </div>

        {/* STATUS DISPLAY */}
        <div className={`p-3.5 rounded-xl border transition-all text-xs font-bold ${
          status === "success" 
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : status === "error"
            ? "bg-red-500/15 border-red-500/40 text-red-300"
            : "bg-blue-500/10 border-blue-500/30 text-blue-200"
        }`}>
          {status === "success" ? (
            <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-1 animate-bounce" />
          ) : status === "error" ? (
            <XCircle size={28} className="mx-auto text-red-400 mb-1" />
          ) : (
            <Camera size={28} className="mx-auto text-blue-400 mb-1 animate-pulse" />
          )}

          <div>{message}</div>
        </div>

        {/* MANUAL INPUT FORM FALLBACK */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-gray-700/60 space-y-2">
          <label className="text-[11px] text-gray-400 font-bold block text-left">
            Ёки QR-код кодини қўлда киритинг:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="auth_qr_..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
            >
              Тасдиқлаш
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
