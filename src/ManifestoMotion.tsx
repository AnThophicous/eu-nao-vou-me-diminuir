import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Fingerprint,
  MoveUpRight,
  ScanLine,
  Volume2,
} from "lucide-react";
import KineticText from "./KineticText";

export function VoiceReel() {
  return (
    <div
      className="voice-reel"
      aria-label="Eu quero sentir. Eu quero existir. Eu quero berrar."
    >
      <span aria-hidden="true" className="voice-prefix">
        EU QUERO
      </span>
      <span className="reel-window" aria-hidden="true">
        <span className="reel-track">
          {["SENTIR.", "EXISTIR.", "BERRAR.", "SENTIR."].map((word, i) => (
            <span key={i}>{word}</span>
          ))}
        </span>
      </span>
      <div className="reel-caption">
        <Volume2 aria-hidden="true" />
        <span>MINHA VOZ NÃO É UM ERRO DE COMPOSIÇÃO.</span>
      </div>
    </div>
  );
}

export function PressureChamber({ quiet }: { quiet: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const section = root.current!;
    let frame = 0;
    let active = false;
    const paint = () => {
      frame = 0;
      if (!active) return;
      const rect = section.getBoundingClientRect();
      const value = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)),
      );
      section.style.setProperty("--chamber", String(quiet ? 0.5 : value));
      section.dataset.phase =
        value > 0.65 ? "recusa" : value > 0.28 ? "pressao" : "contencao";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      setVisible(active);
      schedule();
    });
    observer.observe(section);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, [quiet]);
  return (
    <section
      ref={root}
      className={`pressure-chamber ${visible ? "in-view" : ""}`}
      id="pressao"
      data-chapter="pressão / não vou ceder"
      aria-labelledby="pressure-title"
      style={{ "--chamber": 0 } as CSSProperties}
    >
      <div className="pressure-sticky">
        <div className="pressure-color" aria-hidden="true" />
        <div className="pressure-grid" aria-hidden="true" />
        <div className="pressure-meta micro">
          <span>ISTO É O QUE ACONTECE QUANDO VOCÊ ENGOLE TUDO.</span>
          <ScanLine aria-hidden="true" />
        </div>
        <div className="pressure-orbit" aria-hidden="true">
          <svg viewBox="0 0 800 800" fill="none">
            {Array.from({ length: 18 }, (_, i) => (
              <ellipse
                key={i}
                cx="400"
                cy="400"
                rx={120 + i * 13}
                ry={320 - i * 8}
                stroke="currentColor"
                strokeWidth="0.8"
                transform={`rotate(${i * 10} 400 400)`}
              />
            ))}
          </svg>
        </div>
        <div className="pressure-echo" aria-hidden="true">
          <span>CALE.</span>
          <span>CORTE.</span>
          <span>CAIBA.</span>
        </div>
        <h2 id="pressure-title">
          <span className="pressure-title-first">EU AINDA</span>
          <span className="pressure-title-last">SINTO.</span>
        </h2>
        <p className="pressure-answer">
          E VOCÊ NÃO VAI
          <br />
          <em>TIRAR ISSO DE MIM.</em>
        </p>
        <div className="pressure-bottom micro">
          <span>
            O QUE VOCÊ TENTA APAGAR
            <br />
            APRENDE A FAZER BARULHO.
          </span>
          <ArrowDown aria-hidden="true" />
          <span>
            CONTINUE.
            <br />
            ATÉ A CONTENÇÃO CEDER.
          </span>
        </div>
      </div>
    </section>
  );
}

const marks = [
  "EU NÃO CEDO.",
  "EU EXISTO.",
  "EU QUERO SER EU.",
  "A VOZ É MINHA.",
  "NÃO VOU CABER.",
  "EU NÃO CEDO.",
];
export function DefianceWall({ onStrike }: { onStrike: () => void }) {
  const [count, setCount] = useState(0);
  return (
    <section
      className={`defiance-wall ${count ? "has-marks" : ""}`}
      aria-labelledby="defiance-title"
    >
      <div className="section-label">
        <span>UMA SUPERFÍCIE PARA A SUA RECUSA.</span>
        <span>CLIQUE. DEIXE SUA MARCA.</span>
      </div>
      <div className="stamp-field">
        <div className="stamp-underprint" aria-hidden="true">
          PADRÃO
          <br />
          APROVADO.
        </div>
        <div className="stamp-art" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="voice-stamp"
              style={
                {
                  "--stamp-x": `${12 + ((i * 19) % 48)}%`,
                  "--stamp-y": `${8 + ((i * 23) % 58)}%`,
                  "--stamp-r": `${i % 2 ? 8 : -12}deg`,
                } as CSSProperties
              }
            >
              {marks[i]}
            </span>
          ))}
        </div>
        <div className="stamp-control">
          <Fingerprint aria-hidden="true" />
          <h2 id="defiance-title">
            A SUA RÉGUA
            <br />
            <KineticText text="NÃO ME MEDE." variant="cut" />
          </h2>
          <button
            className="stamp-button"
            onClick={() => {
              setCount((v) => (v >= marks.length ? 1 : v + 1));
              onStrike();
            }}
          >
            <span>CARIMBAR MINHA RECUSA</span>
            <MoveUpRight aria-hidden="true" />
          </button>
          <p className="micro" aria-live="polite">
            {count
              ? "SUA RECUSA FICOU MARCADA."
              : "ESTA MARCA NÃO PRECISA DE APROVAÇÃO."}
          </p>
        </div>
      </div>
      <div className="counter-marquee" aria-hidden="true">
        {[0, 1].map((i) => (
          <span key={i}>
            CHEGA DE ENGOLIR <ArrowUpRight /> CHEGA DE SUMIR <ArrowUpRight />{" "}
            CHEGA DE PEDIR LICENÇA <ArrowUpRight />
          </span>
        ))}
      </div>
    </section>
  );
}

export function RageEcho({ text }: { text: string }) {
  return (
    <span className="rage-echo" aria-hidden="true">
      <span>{text}</span>
      <span>{text}</span>
      <span>{text}</span>
    </span>
  );
}
