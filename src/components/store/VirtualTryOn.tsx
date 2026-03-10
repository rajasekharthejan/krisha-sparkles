"use client";

/**
 * VirtualTryOn — AR Jewelry Try-On powered by MediaPipe FaceMesh (CDN, no npm)
 *
 * Supports:
 *  • Earrings   — overlay on both ear lobe positions (landmarks 234 / 454)
 *  • Necklaces  — overlay below chin / neck area (landmark 152 + jaw width)
 *
 * Image pipeline (in priority order):
 *  1. Pre-processed transparent PNG from `product.images_no_bg[]` (via remove.bg)
 *  2. Client-side flood-fill + pixel-threshold background removal (fallback)
 *  3. Raw product image (last resort if CORS blocks pixel access)
 *
 * Features:
 *  • Live webcam + face landmark tracking (468 points, 30fps)
 *  • Smoothed overlay (lerp 0.35 / 0.65) to prevent jitter
 *  • Mirrored selfie view
 *  • Front / back camera flip
 *  • Product image selector (try each photo angle)
 *  • Shutter button → capture photo with watermark
 *  • Download / Web Share API
 *  • Loading stages, face-detection pill, face-guide oval
 *  • Fully mobile-responsive full-screen modal
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { X, Camera, FlipHorizontal2, Download, Sparkles, RefreshCw } from "lucide-react";
import type { Product } from "@/types";

// ── MediaPipe types (CDN-loaded, not npm) ────────────────────────────────────
type FL = { x: number; y: number; z: number };
type FaceResults = { multiFaceLandmarks?: FL[][] };
interface FMesh {
  setOptions(o: object): void;
  onResults(cb: (r: FaceResults) => void): void;
  send(i: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}
declare global {
  interface Window {
    FaceMesh: new (o: { locateFile(f: string): string }) => FMesh;
  }
}

// ── Constants ────────────────────────────────────────────────────────────────
const MP_CDN = "https://unpkg.com/@mediapipe/face_mesh@0.4.1633559619";
const MP_CDN_FALLBACK = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619";

const EARRING_KEYS = ["earring", "jhumka", "stud", "chandbali", "ear-ring"];
const NECKLACE_KEYS = ["necklace", "pendant", "jadau", "haaram", "choker", "chain", "maala"];

type JType = "earrings" | "necklace" | "none";

function detectJewelType(slug: string): JType {
  const s = slug.toLowerCase();
  if (EARRING_KEYS.some((k) => s.includes(k))) return "earrings";
  if (NECKLACE_KEYS.some((k) => s.includes(k))) return "necklace";
  return "none";
}

// ── Loading stage label → progress bar index ─────────────────────────────────
const STAGES = ["Loading AR engine…", "Requesting camera…", "Initializing face mesh…"];

// ── Small action button helper ───────────────────────────────────────────────
function Btn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick(): void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.3rem",
        background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "14px",
        padding: "0.7rem 1rem",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "#333" : "#bbb",
        fontSize: "0.68rem",
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s",
        width: "68px",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Flood-fill background removal (fallback when no pre-processed image) ────
// Uses flood-fill from all 4 corners to find connected background,
// then removes mannequin dark areas, with edge feathering.
function extractJewelryFallback(img: HTMLImageElement, jewelType: JType): HTMLCanvasElement | null {
  try {
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    // For necklaces: auto-crop to bottom 55% to skip mannequin head
    const cropTop = jewelType === "necklace" ? Math.floor(H * 0.35) : 0;
    const cropH = H - cropTop;

    const oc = document.createElement("canvas");
    oc.width = W;
    oc.height = cropH;
    const ctx = oc.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    // Draw the cropped region
    ctx.drawImage(img, 0, cropTop, W, cropH, 0, 0, W, cropH);
    const id = ctx.getImageData(0, 0, W, cropH);
    const d = id.data;

    // --- Pass 1: Flood-fill from corners to find connected background ---
    const visited = new Uint8Array(W * cropH);
    const bgMask = new Uint8Array(W * cropH); // 1 = background

    // Tolerance for flood fill (how similar a pixel must be to seed)
    const BG_TOLERANCE = 45;

    function floodFill(startX: number, startY: number) {
      const idx0 = (startY * W + startX) * 4;
      const seedR = d[idx0], seedG = d[idx0 + 1], seedB = d[idx0 + 2];
      // Only start flood fill if seed pixel is light (background-like)
      const seedBright = (seedR + seedG + seedB) / 3;
      if (seedBright < 150) return; // don't flood fill from dark corners

      const stack: number[] = [startX, startY];
      while (stack.length > 0) {
        const y = stack.pop()!;
        const x = stack.pop()!;
        if (x < 0 || x >= W || y < 0 || y >= cropH) continue;
        const pi = y * W + x;
        if (visited[pi]) continue;
        visited[pi] = 1;

        const i = pi * 4;
        const dr = Math.abs(d[i] - seedR);
        const dg = Math.abs(d[i + 1] - seedG);
        const db = Math.abs(d[i + 2] - seedB);
        if (dr + dg + db > BG_TOLERANCE * 3) continue;

        bgMask[pi] = 1;
        // 4-connected neighbors
        stack.push(x + 1, y);
        stack.push(x - 1, y);
        stack.push(x, y + 1);
        stack.push(x, y - 1);
      }
    }

    // Start flood fill from all 4 corners and edge midpoints
    floodFill(0, 0);
    floodFill(W - 1, 0);
    floodFill(0, cropH - 1);
    floodFill(W - 1, cropH - 1);
    floodFill(Math.floor(W / 2), 0); // top center
    floodFill(0, Math.floor(cropH / 2)); // left center
    floodFill(W - 1, Math.floor(cropH / 2)); // right center

    // --- Pass 2: Per-pixel processing ---
    for (let pi = 0; pi < W * cropH; pi++) {
      const i = pi * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const avg = (r + g + b) / 3;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
      const bright = avg / 255;

      if (bgMask[pi]) {
        // Flood-fill detected background → fully transparent
        d[i + 3] = 0;
      } else if (bright > 0.75 && sat < 0.08) {
        // Near-white that flood fill missed (isolated bg patches)
        const t = Math.min(1, (bright - 0.75) / 0.1 + (0.08 - sat) / 0.08);
        d[i + 3] = Math.round((1 - t) * 255);
      } else if (bright < 0.25 && sat < 0.12) {
        // Very dark mannequin areas (neck, hair, shadows)
        const t = Math.min(1, (0.25 - bright) / 0.15 + (0.12 - sat) / 0.12);
        d[i + 3] = Math.round((1 - t) * 255);
      } else if (bright < 0.45 && sat < 0.08) {
        // Mid-grey mannequin skin/clothing (the problem zone)
        const t = Math.min(1, ((0.45 - bright) / 0.2) * ((0.08 - sat) / 0.08));
        d[i + 3] = Math.round((1 - t * 0.85) * 255);
      }
      // else: colorful/saturated pixels (gold, gems) → keep fully opaque
    }

    // --- Pass 3: Edge feathering (3px blur on alpha channel) ---
    const alpha = new Uint8Array(W * cropH);
    for (let pi = 0; pi < W * cropH; pi++) alpha[pi] = d[pi * 4 + 3];

    for (let y = 1; y < cropH - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const pi = y * W + x;
        const a = alpha[pi];
        // Only feather edges (where alpha transitions between 0 and 255)
        if (a > 10 && a < 245) {
          // Average with neighbors for smoother edges
          const sum =
            alpha[pi - W - 1] + alpha[pi - W] + alpha[pi - W + 1] +
            alpha[pi - 1] + alpha[pi] * 2 + alpha[pi + 1] +
            alpha[pi + W - 1] + alpha[pi + W] + alpha[pi + W + 1];
          d[pi * 4 + 3] = Math.round(sum / 10);
        }
      }
    }

    ctx.putImageData(id, 0, 0);
    return oc;
  } catch {
    // CORS taint — fall back to raw image
    return null;
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export default function VirtualTryOn({ product }: { product: Product }) {
  const jtype = detectJewelType(product.category?.slug ?? "");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState("");
  const [ready, setReady] = useState(false);
  const [faceOn, setFaceOn] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [imgIdx, setImgIdx] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [hasTransparent, setHasTransparent] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overImgRef = useRef<HTMLImageElement | null>(null);
  // Processed canvas with background/mannequin removed (only used as fallback)
  const overCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshRef = useRef<FMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const smoothRef = useRef<FL[] | null>(null);
  const mpLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  // Track mount state so async ops don't setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Pre-load the overlay image — prefer transparent (no-bg) version
  useEffect(() => {
    if (!open) return;

    // Priority: transparent PNG from remove.bg > original image
    const noBgUrl = product.images_no_bg?.[imgIdx];
    const originalUrl = product.images?.[imgIdx];
    const url = noBgUrl || originalUrl;
    if (!url) return;

    const usingTransparent = !!noBgUrl;
    setHasTransparent(usingTransparent);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      overImgRef.current = img;
      if (usingTransparent) {
        // Pre-processed transparent image — no extraction needed!
        overCanvasRef.current = null;
      } else {
        // Fallback: client-side extraction with flood-fill
        overCanvasRef.current = extractJewelryFallback(img, jtype);
      }
    };

    return () => {
      overImgRef.current = null;
      overCanvasRef.current = null;
    };
  }, [imgIdx, open, product.images, product.images_no_bg, jtype]);

  // ── Stop everything ──────────────────────────────────────────────────────
  function stopAll() {
    cancelAnimationFrame(rafRef.current);
    meshRef.current?.close();
    meshRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    smoothRef.current = null;
    if (mountedRef.current) {
      setReady(false);
      setFaceOn(false);
      setLoading("");
    }
  }

  // ── Load MediaPipe script from CDN (unpkg primary, jsdelivr fallback) ───
  async function loadMediaPipe(): Promise<void> {
    if (mpLoadedRef.current) return;

    const tryLoad = (baseUrl: string) =>
      new Promise<string>((res, rej) => {
        const existing = document.querySelector(`script[src="${baseUrl}/face_mesh.js"]`);
        if (existing) existing.remove();
        const s = document.createElement("script");
        s.src = `${baseUrl}/face_mesh.js`;
        s.onload = () => res(baseUrl);
        s.onerror = () => rej(new Error(`CDN failed: ${baseUrl}`));
        document.head.appendChild(s);
      });

    let activeCdn: string;
    try {
      activeCdn = await tryLoad(MP_CDN);
    } catch {
      try {
        activeCdn = await tryLoad(MP_CDN_FALLBACK);
      } catch {
        throw new Error("Failed to load AR engine. Please check your connection and try again.");
      }
    }
    mpLoadedRef.current = true;
    (window as Window & { _ksMpCdn?: string })._ksMpCdn = activeCdn;
  }

  // ── Start the AR pipeline ────────────────────────────────────────────────
  async function startAR(cam: "user" | "environment") {
    if (!mountedRef.current) return;

    // Step 1 — MediaPipe
    if (mountedRef.current) setLoading(STAGES[0]);
    try {
      await loadMediaPipe();
    } catch (e) {
      if (mountedRef.current) {
        setErr(e instanceof Error ? e.message : "Failed to load AR engine.");
        setLoading("");
      }
      return;
    }
    if (!mountedRef.current) return;

    // Step 2 — Camera
    if (mountedRef.current) setLoading(STAGES[1]);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cam, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera error";
      if (mountedRef.current) {
        setErr(
          msg.includes("NotAllowed") || msg.includes("Permission") || msg.includes("Denied")
            ? "Camera access was denied. Please allow camera permissions in your browser settings."
            : `Camera error: ${msg}`
        );
        setLoading("");
      }
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => {});
    await new Promise<void>((r) => {
      if (video.readyState >= 1) return r();
      video.addEventListener("loadedmetadata", () => r(), { once: true });
    });
    if (!mountedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Step 3 — FaceMesh
    if (mountedRef.current) setLoading(STAGES[2]);
    const cdn = (window as Window & { _ksMpCdn?: string })._ksMpCdn ?? MP_CDN;
    const mesh = new window.FaceMesh({ locateFile: (f) => `${cdn}/${f}` });
    mesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    mesh.onResults((res) => {
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = video.videoWidth;
      const H = video.videoHeight;
      canvas.width = W;
      canvas.height = H;

      // Mirrored selfie draw
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -W, 0, W, H);
      ctx.restore();

      if (res.multiFaceLandmarks?.length) {
        if (mountedRef.current) setFaceOn(true);
        const raw = res.multiFaceLandmarks[0];
        // Smooth landmarks (lerp)
        const prev = smoothRef.current;
        const lms: FL[] = prev
          ? raw.map((lm, i) => ({
              x: prev[i].x * 0.35 + lm.x * 0.65,
              y: prev[i].y * 0.35 + lm.y * 0.65,
              z: lm.z,
            }))
          : [...raw];
        smoothRef.current = lms;
        drawJewelry(ctx, lms, W, H);
      } else {
        if (mountedRef.current) setFaceOn(false);
        smoothRef.current = null;
      }
    });

    meshRef.current = mesh;

    // Inference loop
    const tick = async () => {
      if (!mountedRef.current || !meshRef.current || !videoRef.current) return;
      if (videoRef.current.readyState >= 2) {
        await meshRef.current.send({ image: videoRef.current });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    if (mountedRef.current) {
      setReady(true);
      setLoading("");
    }
  }

  // ── Overlay drawing ──────────────────────────────────────────────────────
  function drawJewelry(ctx: CanvasRenderingContext2D, lms: FL[], W: number, H: number) {
    // Prefer the background-removed canvas; then transparent image; then raw image
    const src: CanvasImageSource | null =
      overCanvasRef.current ?? overImgRef.current;
    if (!src) return;

    const srcW = src instanceof HTMLImageElement ? src.naturalWidth : (src as HTMLCanvasElement).width;
    const srcH = src instanceof HTMLImageElement ? src.naturalHeight : (src as HTMLCanvasElement).height;

    // Mirror x: landmarks come in original (non-mirrored) space,
    // but canvas is drawn mirrored, so invert x.
    const mx = (i: number) => (1 - lms[i].x) * W;
    const my = (i: number) => lms[i].y * H;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.95;

    if (jtype === "earrings") {
      // Earrings: place at ear lobes (landmarks 234 = right ear, 454 = left ear)
      const lx = mx(454);
      const ly = my(454);
      const rx = mx(234);
      const ry = my(234);
      const faceW = Math.abs(rx - lx);
      const ew = faceW * 0.32;
      const eh = ew * (srcH / srcW) * 2;

      ctx.drawImage(src, lx - ew * 0.5, ly, ew, eh);
      ctx.drawImage(src, rx - ew * 0.5, ry, ew, eh);
    } else {
      // Necklace: position below chin, spanning shoulder-to-shoulder
      // Key landmarks:
      //   152 = chin (bottom of face)
      //   234 = right jaw near ear
      //   454 = left jaw near ear
      //   10  = forehead top
      //   172 = right jawline lower
      //   397 = left jawline lower
      const lx = mx(454); // left ear area
      const rx = mx(234); // right ear area
      const chinY = my(152);
      const foreheadY = my(10);
      const faceH = chinY - foreheadY;
      const faceW = Math.abs(rx - lx);

      // Necklace width: 2.2× face width for good coverage
      const nw = faceW * 2.2;
      const nh = nw * (srcH / srcW);

      // Center horizontally on face center
      const faceCenterX = (lx + rx) / 2;
      const nx = faceCenterX - nw / 2;

      // Position: start slightly below chin (5% of face height gap)
      const ny = chinY + faceH * 0.05;

      ctx.drawImage(src, nx, ny, nw, nh);
    }

    ctx.restore();
  }

  // ── Capture photo with watermark ─────────────────────────────────────────
  function capture() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const W = canvas.width;
      const H = canvas.height;
      const size = Math.max(14, W * 0.016);
      ctx.font = `bold ${size}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(201,168,76,0.85)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("✨ Krisha Sparkles", W - 16, H - 14);
    }
    setPhoto(canvas.toDataURL("image/jpeg", 0.92));
  }

  function downloadPhoto() {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo;
    a.download = "krisha-sparkles-tryon.jpg";
    a.click();
  }

  async function sharePhoto() {
    if (!photo) return;
    try {
      const blob = await (await fetch(photo)).blob();
      const file = new File([blob], "krisha-sparkles-tryon.jpg", { type: "image/jpeg" });
      await navigator.share({ title: `Try-On: ${product.name}`, files: [file] });
    } catch {
      downloadPhoto();
    }
  }

  // ── Lifecycle: open / facing changes → restart AR ────────────────────────
  useEffect(() => {
    if (!open) {
      stopAll();
      return;
    }
    stopAll();
    setPhoto(null);
    setErr("");
    const id = setTimeout(() => startAR(facing), 150);
    return () => {
      clearTimeout(id);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render for non-jewelry categories
  if (jtype === "none") return null;

  const si = STAGES.indexOf(loading);
  const canCapture = ready && faceOn && !photo;

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1.1rem",
          background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))",
          border: "1px solid var(--gold)",
          borderRadius: "8px",
          color: "var(--gold)",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          transition: "all 0.2s",
          width: "fit-content",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(201,168,76,0.22)";
          e.currentTarget.style.boxShadow = "0 0 16px rgba(201,168,76,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Camera size={14} />
        ✨ Try It On (AR)
      </button>

      {/* ── Full-screen AR modal ────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.25rem",
              background: "rgba(10,10,10,0.97)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(201,168,76,0.2)",
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--gold)",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                ✨ Virtual Try-On
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginTop: "0.15rem",
                  maxWidth: "220px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 0,
                }}
              >
                {product.name}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Camera / canvas area ── */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
            {/* Hidden video element (feed to MediaPipe) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{ position: "absolute", opacity: 0, width: 1, height: 1, top: 0, left: 0 }}
            />

            {/* Live AR canvas */}
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: ready && !photo ? "block" : "none",
              }}
            />

            {/* Captured photo */}
            {photo && (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <img
                  src={photo}
                  alt="Virtual try-on photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Loading / error overlay */}
            {!ready && !photo && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1.25rem",
                  background: "rgba(0,0,0,0.93)",
                }}
              >
                {err ? (
                  <>
                    <div style={{ fontSize: "3rem" }}>📷</div>
                    <p
                      style={{
                        color: "#f87171",
                        textAlign: "center",
                        maxWidth: "280px",
                        fontSize: "0.85rem",
                        lineHeight: 1.65,
                        padding: "0 1rem",
                      }}
                    >
                      {err}
                    </p>
                    <button
                      onClick={() => {
                        setErr("");
                        startAR(facing);
                      }}
                      style={{
                        background: "var(--gold)",
                        color: "#000",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.65rem 1.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    {/* Animated spinner */}
                    <div style={{ position: "relative", width: "62px", height: "62px" }}>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "3px solid rgba(201,168,76,0.15)",
                          borderTopColor: "var(--gold)",
                          animation: "ks-spin 1s linear infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: "10px",
                          borderRadius: "50%",
                          border: "2px solid rgba(201,168,76,0.08)",
                          borderTopColor: "rgba(201,168,76,0.45)",
                          animation: "ks-spin 1.6s linear infinite reverse",
                        }}
                      />
                      <Camera
                        size={18}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%,-50%)",
                          color: "var(--gold)",
                        }}
                      />
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "var(--gold)", fontSize: "0.87rem", fontWeight: 600, margin: 0 }}>
                        {loading || "Starting…"}
                      </p>
                      {/* Progress dots */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "6px",
                          marginTop: "0.75rem",
                        }}
                      >
                        {STAGES.map((_, i) => (
                          <div
                            key={i}
                            style={{
                              height: "6px",
                              borderRadius: "3px",
                              width: i <= si ? "20px" : "6px",
                              background: i <= si ? "var(--gold)" : "rgba(201,168,76,0.18)",
                              transition: "all 0.4s ease",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.7rem", margin: 0 }}>
                      Powered by MediaPipe FaceMesh
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Face detection status pill */}
            {ready && !photo && (
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: faceOn ? "rgba(34,197,94,0.14)" : "rgba(10,10,10,0.65)",
                  border: `1px solid ${faceOn ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: "20px",
                  padding: "0.38rem 0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.35s ease",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: faceOn ? "#22c55e" : "#555",
                    boxShadow: faceOn ? "0 0 8px rgba(34,197,94,0.9)" : "none",
                    transition: "all 0.35s ease",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: faceOn ? "#86efac" : "#555",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  {faceOn
                    ? `${jtype === "earrings" ? "👂" : "📿"} Jewelry overlay active${hasTransparent ? "" : " (basic)"}`
                    : "Position your face in frame"}
                </span>
              </div>
            )}

            {/* Face guide oval — shown when camera ready but no face detected */}
            {ready && !photo && !faceOn && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "min(240px, 52vw)",
                  height: "min(320px, 70vw)",
                  borderRadius: "50%",
                  border: "2px dashed rgba(201,168,76,0.3)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.18)",
                  pointerEvents: "none",
                  animation: "ks-pulse-border 2.5s ease-in-out infinite",
                }}
              />
            )}

            {/* Jewelry type hint badge */}
            {ready && faceOn && !photo && (
              <div
                style={{
                  position: "absolute",
                  bottom: "1.25rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "20px",
                  padding: "0.3rem 0.85rem",
                  pointerEvents: "none",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>
                  {jtype === "earrings"
                    ? "Earring overlay — facing front camera"
                    : "Necklace overlay — face the camera straight"}
                </span>
              </div>
            )}
          </div>

          {/* ── Bottom controls ── */}
          <div
            style={{
              background: "rgba(10,10,10,0.97)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              padding: "0.9rem 1rem 1.5rem",
              flexShrink: 0,
            }}
          >
            {/* Image selector strip */}
            {!photo && (product.images?.length ?? 0) > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "0.8rem",
                  marginBottom: "0.9rem",
                  scrollbarWidth: "none",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.28)",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    flexShrink: 0,
                    marginRight: "0.25rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Style:
                </span>
                {product.images!.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: "50px",
                      height: "50px",
                      borderRadius: "9px",
                      overflow: "hidden",
                      border: `2px solid ${imgIdx === i ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                      cursor: "pointer",
                      padding: 0,
                      background: "#111",
                      boxShadow:
                        imgIdx === i ? "0 0 12px rgba(201,168,76,0.45)" : "none",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Style ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Small indicator if this image has AR-ready transparent version */}
                    {product.images_no_bg?.[i] && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "2px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#22c55e",
                          border: "1.5px solid #000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "7px",
                        }}
                        title="AR-ready"
                      >
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              {photo ? (
                /* Post-capture controls */
                <>
                  <Btn
                    icon={<RefreshCw size={18} />}
                    label="Retake"
                    onClick={() => setPhoto(null)}
                  />
                  <button
                    onClick={downloadPhoto}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "var(--gold)",
                      border: "none",
                      borderRadius: "14px",
                      padding: "0.9rem 2.25rem",
                      cursor: "pointer",
                      color: "#000",
                      fontWeight: 700,
                      boxShadow: "0 4px 24px rgba(201,168,76,0.45)",
                    }}
                  >
                    <Download size={22} />
                    <span style={{ fontSize: "0.7rem" }}>Save Photo</span>
                  </button>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <Btn
                      icon={<Sparkles size={18} />}
                      label="Share"
                      onClick={sharePhoto}
                    />
                  )}
                </>
              ) : (
                /* Live camera controls */
                <>
                  <Btn
                    icon={<FlipHorizontal2 size={18} />}
                    label="Flip"
                    onClick={() =>
                      setFacing((f) => (f === "user" ? "environment" : "user"))
                    }
                    disabled={!ready}
                  />

                  {/* Shutter button */}
                  <button
                    onClick={capture}
                    disabled={!canCapture}
                    title={
                      !ready
                        ? "Camera loading…"
                        : !faceOn
                        ? "Position your face in frame"
                        : "Capture photo"
                    }
                    style={{
                      width: "74px",
                      height: "74px",
                      borderRadius: "50%",
                      background: canCapture
                        ? "var(--gold)"
                        : "rgba(255,255,255,0.07)",
                      border: `4px solid ${canCapture ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
                      cursor: canCapture ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: canCapture
                        ? "0 0 32px rgba(201,168,76,0.6)"
                        : "none",
                      transition: "all 0.3s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Camera size={26} color={canCapture ? "#000" : "#444"} />
                  </button>

                  {/* Spacer to keep shutter centred */}
                  <div style={{ width: "68px" }} />
                </>
              )}
            </div>

            {/* Tips */}
            {!photo && ready && faceOn && (
              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontSize: "0.68rem",
                  marginTop: "0.7rem",
                  marginBottom: 0,
                }}
              >
                Move closer for better tracking • Tap style thumbnails above to change jewel view
              </p>
            )}
            {!photo && ready && !faceOn && (
              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontSize: "0.68rem",
                  marginTop: "0.7rem",
                  marginBottom: 0,
                }}
              >
                Look straight at the camera — ensure good lighting
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ks-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ks-pulse-border {
          0%, 100% { border-color: rgba(201,168,76,0.3); }
          50%       { border-color: rgba(201,168,76,0.6); }
        }
      `}</style>
    </>
  );
}
