"use client";

import { useEffect, useRef } from "react";
import { CanvasTexture, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from "three";
import { ART, TEX_H, TEX_W, drawArt, drawTile, loadFonts, readFonts, type Fonts } from "@/components/gallery/wall/tile-texture";
import type { Ad } from "@/lib/domain/types";
import {
  COLS,
  CURVE,
  K,
  OUTLINE,
  RIM_CULL,
  ROWS,
  TILE_H,
  TILE_W,
  WALL_H,
  WALL_W,
  adIndexFor,
  displace,
  inPolygon,
  wrap,
} from "@/lib/gallery/wall-math";

const MAX_VIDEOS = 4;
const VIDEO_FPS = 24;
const FOV = 40;

// The same transform as `displace()` in lib/gallery/wall-math.ts, on the GPU.
const VERTEX = /* glsl */ `
  uniform vec2 uCenter;
  uniform vec2 uSize;
  uniform float uAppear;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    vUv = uv;
    vec2 p = uCenter + position.xy * uSize * mix(0.88, 1.0, uAppear);
    float s = 1.0 / (1.0 + ${K.toFixed(5)} * dot(p, p));
    vec2 q = p * s;
    float r = length(q);
    float rim = smoothstep(3.0, 4.3, r);
    float top = smoothstep(1.35, 2.35, q.y) * 0.6;
    vFade = (1.0 - rim) * (1.0 - top) * uAppear;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(q, -${CURVE.toFixed(5)} * r * r, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uHover;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    vec3 c = texture2D(uTex, vUv).rgb;
    c *= 1.0 + 0.2 * uHover;
    gl_FragColor = vec4(c * vFade, 1.0);
  }
`;

interface AdTexture {
  ad: Ad;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  poster: HTMLImageElement | null;
  loop: string | null;
  video: HTMLVideoElement | null;
  playing: boolean;
}

interface Tile {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  tex: AdTexture;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  r: number;
  hover: number;
  appear: number;
}

export interface WallProps {
  ads: Ad[];
  reducedMotion: boolean;
  onOpen: (ad: Ad) => void;
  onInactive: (ad: Ad) => void;
  /** Called if WebGL cannot start, so the page can fall back to the grid. */
  onUnsupported: () => void;
}

/**
 * The gallery as an endless, fisheye-curved wall of tiles you drag around. Each tile is a canvas
 * texture (text and pills drawn once, the ad's poster inside it). Animated ads play their recorded
 * loop on the few tiles nearest the centre. Real ads are never drawn here: they are iframes and
 * stay in ordinary page slots.
 */
export function GalleryWall({ ads, reducedMotion, onOpen, onInactive, onUnsupported }: WallProps) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onOpen, onInactive, onUnsupported });
  // Kept current after every render. The scene below reads it only from event handlers, never during render.
  useEffect(() => {
    callbacks.current = { onOpen, onInactive, onUnsupported };
  });

  useEffect(() => {
    const container = host.current;
    if (!container || ads.length === 0) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      callbacks.current.onUnsupported();
      return;
    }
    let disposed = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0b0b, 1);
    const canvas = renderer.domElement;
    canvas.setAttribute("data-lenis-prevent", "");
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
    container.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
    const geometry = new PlaneGeometry(1, 1, 14, 18);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const textures: AdTexture[] = ads.map((ad) => {
      const c = document.createElement("canvas");
      c.width = TEX_W;
      c.height = TEX_H;
      const ctx = c.getContext("2d")!;
      const texture = new CanvasTexture(c);
      texture.anisotropy = maxAniso;
      return { ad, canvas: c, ctx, texture, poster: null, loop: null, video: null, playing: false };
    });

    const tiles: Tile[] = [];
    for (let i = 0; i < COLS; i += 1) {
      for (let j = 0; j < ROWS; j += 1) {
        const tex = textures[adIndexFor(i, j, textures.length)];
        const material = new ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          uniforms: {
            uCenter: { value: new Vector2() },
            uSize: { value: new Vector2(TILE_W, TILE_H) },
            uAppear: { value: 0 },
            uHover: { value: 0 },
            uTex: { value: tex.texture },
          },
        });
        const mesh = new Mesh(geometry, material);
        mesh.frustumCulled = false; // the vertex shader moves the vertices, so the bounds are wrong
        scene.add(mesh);
        tiles.push({ mesh, tex, bx: (i - (COLS - 1) / 2) * TILE_W, by: (j - (ROWS - 1) / 2) * TILE_H, cx: 0, cy: 0, r: 0, hover: 0, appear: 0 });
      }
    }

    // ---- state ----
    const offset = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let dragging = false;
    let dragMoved = 0;
    let downAt = 0;
    let last = { x: 0, y: 0, t: 0 };
    let pointer: { x: number; y: number } | null = null; // NDC
    let hovered: Tile | null = null;
    let width = 1;
    let height = 1;
    let unitsPerPx = 0.005;
    let needsRender = true;
    let started = 0;
    let lastVideoDraw = 0;
    let videoFrames = 0;
    const v3 = new Vector3();

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.aspect = aspect;
      // Landscape shows a fixed height; portrait shows a fixed width (about two tiles across).
      const halfH = aspect >= 1 ? 1.75 : 1.2 / aspect;
      camera.position.set(0, 0, halfH / Math.tan((FOV * Math.PI) / 360));
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      unitsPerPx = (2 * halfH) / height;
      needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    // ---- picking: the same maths as the vertex shader, projected to the screen ----
    const toNdc = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -(((clientY - rect.top) / rect.height) * 2 - 1) };
    };
    const project = (x: number, y: number) => {
      const d = displace(x, y);
      v3.set(d.x, d.y, d.z).project(camera);
      return { x: v3.x, y: v3.y };
    };
    const pickAt = (nx: number, ny: number): Tile | null => {
      let best: Tile | null = null;
      for (const tile of tiles) {
        if (!tile.mesh.visible || tile.appear < 0.5) continue;
        if (best && tile.r >= best.r) continue;
        const poly = OUTLINE.map(({ u, v }) => project(tile.cx + u * TILE_W, tile.cy + v * TILE_H));
        if (inPolygon(nx, ny, poly)) best = tile;
      }
      return best;
    };
    const setCursor = () => {
      canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";
    };

    // ---- input ----
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragMoved = 0;
      downAt = performance.now();
      last = { x: e.clientX, y: e.clientY, t: downAt };
      vel.x = vel.y = 0;
      canvas.setPointerCapture(e.pointerId);
      setCursor();
    };
    const onPointerMove = (e: PointerEvent) => {
      pointer = toNdc(e.clientX, e.clientY);
      if (dragging) {
        const now = performance.now();
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        offset.x += dx * unitsPerPx;
        offset.y -= dy * unitsPerPx;
        const dt = Math.max(1, now - last.t) / 1000;
        // Smoothed release velocity, in wall units per second.
        vel.x = vel.x * 0.6 + ((dx * unitsPerPx) / dt) * 0.4;
        vel.y = vel.y * 0.6 + ((-dy * unitsPerPx) / dt) * 0.4;
        last = { x: e.clientX, y: e.clientY, t: now };
      }
      needsRender = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      // A tap, not a drag: open what is under the pointer.
      if (dragMoved < 7 && performance.now() - downAt < 600) {
        const at = toNdc(e.clientX, e.clientY);
        const hit = pickAt(at.x, at.y);
        if (hit) (hit.tex.ad.availability === "inactive" ? callbacks.current.onInactive : callbacks.current.onOpen)(hit.tex.ad);
      }
      if (performance.now() - last.t > 90) vel.x = vel.y = 0; // paused before letting go
      if (reducedMotion) vel.x = vel.y = 0;
      setCursor();
    };
    const onPointerLeave = () => {
      pointer = null;
      needsRender = true;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = unitsPerPx * (e.deltaMode === 1 ? 16 : 1);
      offset.x -= e.deltaX * k;
      offset.y += e.deltaY * k;
      needsRender = true;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const step = TILE_W * 0.8;
      if (e.key === "ArrowLeft") offset.x += step;
      else if (e.key === "ArrowRight") offset.x -= step;
      else if (e.key === "ArrowUp") offset.y -= step;
      else if (e.key === "ArrowDown") offset.y += step;
      else if (e.key === "Enter") {
        const center = pickAt(0, 0) ?? tiles.reduce((a, b) => (b.mesh.visible && b.r < a.r ? b : a), tiles[0]);
        (center.tex.ad.availability === "inactive" ? callbacks.current.onInactive : callbacks.current.onOpen)(center.tex.ad);
        return;
      } else return;
      e.preventDefault();
      needsRender = true;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("keydown", onKeyDown);

    // ---- video loops on the tiles nearest the centre ----
    const manifestLoops = new Map<string, string>();
    const ensureVideo = (tex: AdTexture): HTMLVideoElement | null => {
      if (!tex.loop) return null;
      if (!tex.video) {
        const v = document.createElement("video");
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = "auto";
        v.src = tex.loop;
        tex.video = v;
      }
      return tex.video;
    };
    const syncVideos = () => {
      if (reducedMotion) return;
      const wanted = new Set<AdTexture>();
      const ranked = tiles.filter((t) => t.mesh.visible && t.tex.loop && t.appear > 0.9).sort((a, b) => a.r - b.r);
      for (const t of ranked) {
        if (wanted.size >= MAX_VIDEOS) break;
        wanted.add(t.tex);
      }
      for (const tex of textures) {
        if (wanted.has(tex)) {
          const v = ensureVideo(tex);
          if (v && v.paused) void v.play().catch(() => undefined);
          tex.playing = true;
        } else if (tex.playing) {
          tex.playing = false;
          tex.video?.pause();
          drawArt(tex.ctx, tex.ad, tex.poster); // back to the still
          tex.texture.needsUpdate = true;
          needsRender = true;
        }
      }
      container.dataset.videos = String(wanted.size);
    };

    // ---- load: fonts first, then draw every tile, then fetch the pictures ----
    const fonts: Fonts = readFonts();
    void loadFonts(fonts).then(async () => {
      if (disposed) return;
      for (const tex of textures) {
        drawTile(tex.ctx, tex.ad, fonts, null);
        tex.texture.needsUpdate = true;
      }
      started = performance.now();
      needsRender = true;
      container.dataset.wallReady = "1";

      try {
        const res = await fetch("/gallery/manifest.json");
        if (res.ok) {
          const data = (await res.json()) as { ads: Record<string, { loop?: string }> };
          for (const [id, entry] of Object.entries(data.ads)) if (entry.loop) manifestLoops.set(id, entry.loop);
        }
      } catch {
        // No manifest: tiles still work, just without loops.
      }
      if (disposed) return;
      for (const tex of textures) {
        tex.loop = manifestLoops.get(tex.ad.id) ?? null;
        const img = new Image();
        img.onload = () => {
          if (disposed) return;
          tex.poster = img;
          drawTile(tex.ctx, tex.ad, fonts, img);
          tex.texture.needsUpdate = true;
          needsRender = true;
        };
        img.src = `/gallery/posters/${tex.ad.id}.jpg`;
      }
    });

    // ---- the loop ----
    let lastFrame = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (!dragging && (Math.abs(vel.x) > 0.002 || Math.abs(vel.y) > 0.002)) {
        offset.x += vel.x * dt;
        offset.y += vel.y * dt;
        const friction = Math.exp(-dt * 3.4);
        vel.x *= friction;
        vel.y *= friction;
        needsRender = true;
      }

      const elapsed = started ? (now - started) / 1000 : 0;
      let introRunning = false;
      let hoverTile: Tile | null = null;
      if (pointer && !dragging) hoverTile = pickAt(pointer.x, pointer.y);
      if (hoverTile !== hovered) {
        hovered = hoverTile;
        setCursor();
      }

      for (const tile of tiles) {
        tile.cx = wrap(tile.bx + offset.x, WALL_W);
        tile.cy = wrap(tile.by + offset.y, WALL_H);
        const d = displace(tile.cx, tile.cy);
        tile.r = d.r;
        const visible = d.r < RIM_CULL;
        tile.mesh.visible = visible;
        if (!visible) continue;

        const uniforms = tile.mesh.material.uniforms;
        (uniforms.uCenter.value as Vector2).set(tile.cx, tile.cy);
        // Tiles rise into place from the centre outward.
        const target = started ? Math.min(1, Math.max(0, (elapsed - d.r * 0.09) / 0.9)) : 0;
        const eased = 1 - Math.pow(1 - target, 3);
        if (eased !== tile.appear) {
          tile.appear = eased;
          uniforms.uAppear.value = eased;
          if (eased < 1) introRunning = true;
          needsRender = true;
        }
        const hoverTarget = tile === hovered ? 1 : 0;
        if (Math.abs(tile.hover - hoverTarget) > 0.01) {
          tile.hover += (hoverTarget - tile.hover) * Math.min(1, dt * 12);
          uniforms.uHover.value = tile.hover;
          needsRender = true;
        } else if (tile.hover !== hoverTarget) {
          tile.hover = hoverTarget;
          uniforms.uHover.value = hoverTarget;
          needsRender = true;
        }
      }

      // Playing videos redraw into their tile's texture a few times a second.
      if (!reducedMotion && now - lastVideoDraw > 1000 / VIDEO_FPS) {
        lastVideoDraw = now;
        syncVideos();
        for (const tex of textures) {
          if (tex.playing && tex.video && tex.video.readyState >= 2) {
            drawArt(tex.ctx, tex.ad, tex.video);
            tex.texture.needsUpdate = true;
            videoFrames += 1;
            needsRender = true;
          }
        }
        container.dataset.videoFrames = String(videoFrames);
      }

      if (needsRender || introRunning) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    frame = requestAnimationFrame(tick);

    // A hook for end-to-end tests: where each visible tile currently is on screen.
    if (process.env.NODE_ENV !== "production") {
      (container as HTMLDivElement & { __wall?: unknown }).__wall = {
        tiles: () =>
          tiles
            .filter((t) => t.mesh.visible && t.appear > 0.99)
            .map((t) => {
              const p = project(t.cx, t.cy);
              const rect = canvas.getBoundingClientRect();
              return { id: t.tex.ad.id, x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height, r: t.r };
            }),
        offset: () => ({ ...offset }),
        art: ART,
      };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      container.removeEventListener("keydown", onKeyDown);
      for (const tex of textures) {
        tex.video?.pause();
        tex.video?.removeAttribute("src");
        tex.video?.load();
        tex.texture.dispose();
      }
      for (const tile of tiles) tile.mesh.material.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete container.dataset.wallReady;
      delete container.dataset.videos;
      delete container.dataset.videoFrames;
    };
  }, [ads, reducedMotion]);

  return (
    <div
      ref={host}
      role="group"
      tabIndex={0}
      aria-label="Interactive ad wall. Drag to explore, click a tile to open it, or use the arrow keys and Enter. A grid and a list view are also available."
      className="absolute inset-0 select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hazard"
    />
  );
}
