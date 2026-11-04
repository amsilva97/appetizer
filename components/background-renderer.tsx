"use client";

import { useEffect, useRef } from "react";
import type {
  AuroraConfig,
  BackgroundConfig,
  BokehConfig,
  ConicConfig,
  GeometricConfig,
  GradientConfig,
  MeshConfig,
  ParticlesConfig,
  PlasmaConfig,
  SolidConfig,
  WavyConfig,
} from "@/types/background";

// ─── Solid ────────────────────────────────────────────────────────────────────

function Solid({ config }: { config: SolidConfig }) {
  return <div className="absolute inset-0" style={{ background: config.color }} />;
}

// ─── Gradient ─────────────────────────────────────────────────────────────────

function Gradient({ config }: { config: GradientConfig }) {
  const { animated, speed = 5 } = config;
  const duration = 22 - speed * 2;
  const colors = [...config.colors, config.colors[0]];
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(${config.direction}deg, ${colors.join(", ")})`,
        backgroundSize: animated ? "300% 300%" : undefined,
        animation: animated ? `gradient-shift ${duration}s ease infinite` : undefined,
      }}
    />
  );
}

// ─── Wavy ─────────────────────────────────────────────────────────────────────

interface WaveLayerProps {
  waveColor: string;
  amplitude: number;
  durationSeconds: number;
  opacity: number;
  bottomOffset: number;
}

function WaveLayer({ waveColor, amplitude, durationSeconds, opacity, bottomOffset }: WaveLayerProps) {
  const W = 1440;
  const h = amplitude * 2 + 80;
  const A = amplitude;
  const path = [
    `M0,${A}`,
    `C${W * 0.25},0 ${W * 0.25},0 ${W * 0.5},${A}`,
    `C${W * 0.75},${A * 2} ${W * 0.75},${A * 2} ${W},${A}`,
    `L${W},${h} L0,${h} Z`,
  ].join(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        width: "200%",
        height: h,
        animation: `bg-wave ${durationSeconds}s linear infinite`,
      }}
    >
      {[0, 1].map((i) => (
        <svg
          key={i}
          viewBox={`0 0 ${W} ${h}`}
          preserveAspectRatio="none"
          style={{ width: "50%", height: "100%", display: "inline-block" }}
        >
          <path d={path} fill={waveColor} fillOpacity={opacity} />
        </svg>
      ))}
    </div>
  );
}

function Wavy({ config }: { config: WavyConfig }) {
  const { baseColor, waveColor, speed, amplitude, layers } = config;
  const baseDuration = 22 - speed * 2;
  const layerDefs = Array.from({ length: layers }, (_, i) => ({
    amplitudeMul: 1 - i * (0.15 / layers) * layers,
    durationMul: [1, 1.3, 0.75, 1.5, 0.9][i],
    opacity: 0.5 - i * (0.08 / layers) * layers,
    bottomOffset: amplitude * i * 0.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: baseColor }}>
      {layerDefs.map((def, i) => (
        <WaveLayer
          key={i}
          waveColor={waveColor}
          amplitude={amplitude * def.amplitudeMul}
          durationSeconds={baseDuration * def.durationMul}
          opacity={def.opacity}
          bottomOffset={def.bottomOffset}
        />
      ))}
    </div>
  );
}

// ─── Aurora ───────────────────────────────────────────────────────────────────

const AURORA_POSITIONS = [
  { x: 25, y: 30 },
  { x: 75, y: 25 },
  { x: 50, y: 60 },
  { x: 20, y: 72 },
  { x: 80, y: 65 },
];

function Aurora({ config }: { config: AuroraConfig }) {
  const { baseColor, colors, speed, blur } = config;
  const baseDuration = 22 - speed * 2;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: baseColor }}>
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${AURORA_POSITIONS[i % 5].x}%`,
            top: `${AURORA_POSITIONS[i % 5].y}%`,
            width: "72vw",
            height: "72vh",
            borderRadius: "50%",
            background: color,
            filter: `blur(${blur}px)`,
            opacity: 0.65,
            transform: "translate(-50%, -50%)",
            animation: `aurora-blob-${i % 3} ${baseDuration * (0.9 + i * 0.1)}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Particles ────────────────────────────────────────────────────────────────

function Particles({ config }: { config: ParticlesConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const el: HTMLCanvasElement = canvasRef.current;
    const c: CanvasRenderingContext2D = ctx;
    const dpr = window.devicePixelRatio || 1;
    let W = window.innerWidth;
    let H = window.innerHeight;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W * dpr;
      el.height = H * dpr;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      c.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    const speedFactor = config.speed * 0.4;
    const particles = Array.from({ length: config.count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * speedFactor,
      vy: (Math.random() - 0.5) * speedFactor,
      r: Math.random() * config.size + 0.5,
      a: Math.random() * 0.5 + 0.2,
    }));

    const connectionDist = 120;
    let rafId: number;

    function draw() {
      c.clearRect(0, 0, W, H);

      if (config.connected) {
        c.strokeStyle = config.particleColor;
        c.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDist) {
              c.globalAlpha = (1 - dist / connectionDist) * 0.4;
              c.beginPath();
              c.moveTo(particles[i].x, particles[i].y);
              c.lineTo(particles[j].x, particles[j].y);
              c.stroke();
            }
          }
        }
      }

      c.fillStyle = config.particleColor;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        c.globalAlpha = p.a;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.count, config.speed, config.size, config.particleColor, config.connected]);

  return (
    <div className="absolute inset-0" style={{ background: config.baseColor }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

// ─── Mesh ─────────────────────────────────────────────────────────────────────

function Mesh({ config }: { config: MeshConfig }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    const el: HTMLDivElement = divRef.current;

    const speedFactor = config.speed * 0.015;
    const points = config.colors.map((color, i) => {
      const cols = 3;
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        color,
        x: col * (100 / (cols - 1 || 1)) + (Math.random() - 0.5) * 25,
        y: row * 50 + 15 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * speedFactor,
        vy: (Math.random() - 0.5) * speedFactor,
      };
    });

    let rafId: number;

    function update() {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 100) p.vx *= -1;
        if (p.y < 0 || p.y > 100) p.vy *= -1;
      }

      const gradients = points
        .map((p) => `radial-gradient(circle at ${p.x}% ${p.y}%, ${p.color} 0%, transparent 55%)`)
        .join(", ");

      el.style.background = `${gradients}, ${config.baseColor}`;
      rafId = requestAnimationFrame(update);
    }

    update();
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseColor, config.speed, config.colors.join(",")]);

  return <div ref={divRef} className="absolute inset-0" />;
}

// ─── Conic ────────────────────────────────────────────────────────────────────

function Conic({ config }: { config: ConicConfig }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    const el: HTMLDivElement = divRef.current;

    const degsPerFrame = config.speed * 0.3 * (config.reverse ? -1 : 1);
    let angle = 0;
    let rafId: number;

    function update() {
      angle = (angle + degsPerFrame + 360) % 360;
      const stops = [...config.colors, config.colors[0]].join(", ");
      el.style.background = `conic-gradient(from ${angle}deg, ${stops})`;
      rafId = requestAnimationFrame(update);
    }

    update();
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.speed, config.reverse, config.colors.join(",")]);

  return <div ref={divRef} className="absolute inset-0" />;
}

// ─── Plasma ───────────────────────────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function Plasma({ config }: { config: PlasmaConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const el: HTMLCanvasElement = canvasRef.current;
    const c: CanvasRenderingContext2D = ctx;

    const W = 320;
    const H = 180;
    el.width = W;
    el.height = H;

    const imgData = c.createImageData(W, H);
    const data = imgData.data;
    const speedFactor = config.speed * 0.015;
    let t = 0;
    let rafId: number;

    function draw() {
      t += speedFactor;
      const { scale, hueStart, hueRange, saturation } = config;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const v =
            Math.sin(x / scale + t) +
            Math.sin(y / scale + t * 0.8) +
            Math.sin((x + y) / scale + t * 0.6) +
            Math.sin(Math.sqrt(x * x + y * y) / scale);

          const normalized = (v + 4) / 8;
          const hue = ((hueStart + normalized * hueRange) / 360) % 1;
          const [r, g, b] = hslToRgb(hue, saturation, 0.5);
          const i = (y * W + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }

      c.putImageData(imgData, 0, 0);
      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.hueStart, config.hueRange, config.saturation, config.speed, config.scale]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: "auto" }}
    />
  );
}

// ─── Bokeh ────────────────────────────────────────────────────────────────────

function Bokeh({ config }: { config: BokehConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const el: HTMLCanvasElement = canvasRef.current;
    const c: CanvasRenderingContext2D = ctx;
    const dpr = window.devicePixelRatio || 1;
    let W = window.innerWidth;
    let H = window.innerHeight;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W * dpr;
      el.height = H * dpr;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      c.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    const speedFactor = config.speed * 0.3;
    const circles = Array.from({ length: config.count }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * speedFactor,
      vy: (Math.random() - 0.5) * speedFactor,
      r: Math.random() * config.size * 0.7 + config.size * 0.3,
      color: config.colors[i % config.colors.length],
      opacity: Math.random() * 0.35 + 0.1,
    }));

    let rafId: number;

    function draw() {
      c.clearRect(0, 0, W, H);

      for (const circle of circles) {
        circle.x += circle.vx;
        circle.y += circle.vy;
        if (circle.x < -circle.r) circle.x = W + circle.r;
        if (circle.x > W + circle.r) circle.x = -circle.r;
        if (circle.y < -circle.r) circle.y = H + circle.r;
        if (circle.y > H + circle.r) circle.y = -circle.r;

        const grad = c.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, circle.r);
        grad.addColorStop(0, circle.color + "cc");
        grad.addColorStop(0.4, circle.color + "55");
        grad.addColorStop(1, circle.color + "00");

        c.globalAlpha = circle.opacity;
        c.fillStyle = grad;
        c.beginPath();
        c.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        c.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseColor, config.count, config.speed, config.size, config.colors.join(",")]);

  return (
    <div className="absolute inset-0" style={{ background: config.baseColor }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

// ─── Geometric ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

function samplePalette(rgbs: [number, number, number][], phase: number): string {
  const t = Math.max(0, Math.min(1, phase)) * (rgbs.length - 1);
  const i = Math.min(Math.floor(t), rgbs.length - 2);
  return lerpRgb(rgbs[i], rgbs[i + 1], t - i);
}

function Geometric({ config }: { config: GeometricConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const el: HTMLCanvasElement = canvasRef.current;
    const gfx: CanvasRenderingContext2D = ctx;
    let W = window.innerWidth;
    let H = window.innerHeight;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W;
      el.height = H;
    }

    resize();
    window.addEventListener("resize", resize);

    const rgbs = config.colors.map(hexToRgb);
    const speedFactor = config.speed * 0.004;
    let t = 0;
    let rafId: number;

    function draw() {
      t += speedFactor;
      gfx.clearRect(0, 0, W, H);

      const { cellSize } = config;
      const cols = Math.ceil(W / cellSize) + 1;
      const rows = Math.ceil(H / cellSize) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x0 = col * cellSize;
          const y0 = row * cellSize;
          const x1 = x0 + cellSize;
          const y1 = y0 + cellSize;

          const jx = Math.sin(col * 0.7 + row * 0.4) * cellSize * 0.18;
          const jy = Math.cos(col * 0.4 + row * 0.7) * cellSize * 0.18;

          const pts: [number, number][] = [
            [x0 + jx, y0 + jy],
            [x1 + jx, y0 + jy],
            [x0 + jx, y1 + jy],
            [x1 + jx, y1 + jy],
          ];

          const drawTri = (p0: [number, number], p1: [number, number], p2: [number, number], phase: number) => {
            gfx.beginPath();
            gfx.moveTo(p0[0], p0[1]);
            gfx.lineTo(p1[0], p1[1]);
            gfx.lineTo(p2[0], p2[1]);
            gfx.closePath();
            gfx.fillStyle = samplePalette(rgbs, phase);
            gfx.fill();
            gfx.strokeStyle = config.baseColor;
            gfx.lineWidth = 1.5;
            gfx.stroke();
          };

          const p1 = (Math.sin(col * 0.5 + t) + Math.cos(row * 0.4 + t * 0.7)) * 0.5 + 0.5;
          const p2 = (Math.sin(col * 0.5 + t + 1.2) + Math.cos(row * 0.4 + t * 0.7 + 0.8)) * 0.5 + 0.5;

          drawTri(pts[0], pts[1], pts[2], p1);
          drawTri(pts[1], pts[3], pts[2], p2);
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseColor, config.speed, config.cellSize, config.colors.join(",")]);

  return (
    <div className="absolute inset-0" style={{ background: config.baseColor }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

function GrainOverlay({ opacity }: { opacity: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity, mixBlendMode: "overlay" as const }}
    >
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}

function VignetteOverlay({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.9) 100%)",
        opacity,
      }}
    />
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function BackgroundRenderer({ config }: { config: BackgroundConfig }) {
  const grain = config.grain ?? 0;
  const vignette = config.vignette ?? 0;

  return (
    <div className="absolute inset-0">
      {config.type === "solid" && <Solid config={config} />}
      {config.type === "gradient" && <Gradient config={config} />}
      {config.type === "wavy" && <Wavy config={config} />}
      {config.type === "aurora" && <Aurora config={config} />}
      {config.type === "particles" && <Particles config={config} />}
      {config.type === "mesh" && <Mesh config={config} />}
      {config.type === "conic" && <Conic config={config} />}
      {config.type === "plasma" && <Plasma config={config} />}
      {config.type === "bokeh" && <Bokeh config={config} />}
      {config.type === "geometric" && <Geometric config={config} />}
      {grain > 0 && <GrainOverlay opacity={grain} />}
      {vignette > 0 && <VignetteOverlay opacity={vignette} />}
    </div>
  );
}
