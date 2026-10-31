import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { RefObject } from "react";
import { fragmentShader, vertexShader } from "./shaders";

interface StageProps {
  kind?: "void" | "type";
  paused: boolean;
  pressure?: RefObject<number>;
}
function textTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 1600, 400);
  ctx.fillStyle = "#fff";
  ctx.font = '900 310px "Barlow Condensed"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 800, 210, 1540);
  return new THREE.CanvasTexture(canvas);
}
export default function Stage({ kind = "void", paused, pressure }: StageProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    let disposed = false;
    let cleanup = () => {};
    const initialize = () => {
      if (disposed) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: "low-power",
        });
      } catch {
        el.dataset.webgl = "fallback";
        return;
      }
      el.appendChild(renderer.domElement);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const from =
        kind === "type"
          ? textTexture("OBEDEÇA")
          : new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
      const to =
        kind === "type"
          ? textTexture("EXISTA")
          : new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
      const uniforms = {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2() },
        uTime: { value: 4 },
        uPressure: { value: 0 },
        uMode: { value: kind === "type" ? 1 : 0 },
        uFrom: { value: from },
        uTo: { value: to },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
      });
      const geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));
      const pointer = new THREE.Vector2();
      let visible = false;
      let contextLost = false;
      const draw = (time = 0) => {
        if (contextLost) return;
        uniforms.uTime.value = paused ? 4 : time * 0.001;
        uniforms.uPressure.value +=
          ((pressure?.current ?? 0) - uniforms.uPressure.value) *
          (paused ? 1 : 0.08);
        uniforms.uPointer.value.lerp(pointer, 0.04);
        renderer.render(scene, camera);
        el.dataset.drawCalls = String(renderer.info.render.calls);
        el.dataset.webgl = "ready";
      };
      const syncLoop = () => {
        renderer.setAnimationLoop(null);
        if (visible && !document.hidden && !paused && !contextLost)
          renderer.setAnimationLoop(draw);
        else if (visible) draw();
      };
      const resize = new ResizeObserver(() => {
        const { width, height } = el.getBoundingClientRect();
        renderer.setSize(
          Math.max(1, Math.round(width)),
          Math.max(1, Math.round(height)),
          false,
        );
        uniforms.uResolution.value.set(width, height);
        draw();
      });
      resize.observe(el);
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          syncLoop();
        },
        { rootMargin: "80px" },
      );
      observer.observe(el);
      const move = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.set(
          (e.clientX - rect.left) / rect.width - 0.5,
          -(e.clientY - rect.top) / rect.height + 0.5,
        );
      };
      const lost = (e: Event) => {
        e.preventDefault();
        contextLost = true;
        renderer.setAnimationLoop(null);
        el.dataset.webgl = "fallback";
      };
      const restored = () => {
        contextLost = false;
        syncLoop();
        draw();
      };
      el.addEventListener("pointermove", move);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      renderer.domElement.addEventListener("webglcontextrestored", restored);
      document.addEventListener("visibilitychange", syncLoop);
      cleanup = () => {
        renderer.setAnimationLoop(null);
        resize.disconnect();
        observer.disconnect();
        el.removeEventListener("pointermove", move);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        renderer.domElement.removeEventListener(
          "webglcontextrestored",
          restored,
        );
        document.removeEventListener("visibilitychange", syncLoop);
        geometry.dispose();
        material.dispose();
        from.dispose();
        to.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };
    const approach = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        approach.disconnect();
        void document.fonts.ready.then(initialize);
      },
      { rootMargin: "200px" },
    );
    approach.observe(el);
    return () => {
      disposed = true;
      approach.disconnect();
      cleanup();
    };
  }, [kind, paused, pressure]);
  return (
    <div
      ref={host}
      className={`stage stage--${kind}`}
      aria-hidden="true"
      data-webgl="loading"
    >
      <div className="stage-fallback">{kind === "type" ? "EXISTA" : ""}</div>
    </div>
  );
}
