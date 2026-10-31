import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { ReactLenis } from "lenis/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  AudioLines,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import "lenis/dist/lenis.css";
import Stage from "./Stage";
import { chapters, closing, declarations } from "./content";
import useAtmosphere from "./useAtmosphere";
import KineticText from "./KineticText";
import {
  DefianceWall,
  PressureChamber,
  RageEcho,
  VoiceReel,
} from "./ManifestoMotion";
import "./App.css";
import "./Motion.css";

function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <path
          key={angle}
          d="M50 0L54 43L100 50L54 57L50 100L46 57L0 50L46 43Z"
          fill="currentColor"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
    </svg>
  );
}
function ChapterText({ index }: { index: number }) {
  const chapter = chapters[index];
  return (
    <div className="chapter-copy">
      <h3>
        <KineticText text={chapter.title} variant="rise" />
      </h3>
      {chapter.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function App() {
  const [quiet, setMotionOverride] = useState(false);
  const [active, setActive] = useState("início");
  const [held, setHeld] = useState(false);
  const [released, setReleased] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const pressure = useRef(0);
  const typePressure = useRef(0);
  const progress = useRef<HTMLDivElement>(null);
  const rupture = useRef<HTMLElement>(null);
  const { sound, error, toggle, release, volume, setVolume, strike } =
    useAtmosphere();
  const releaseRef = useRef(release);
  useEffect(() => {
    releaseRef.current = release;
  }, [release]);

  useEffect(() => {
    document.documentElement.dataset.motion = quiet ? "reduced" : "full";
  }, [quiet]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries)
        (entry.target as HTMLElement).dataset.motionActive = String(
          entry.isIntersecting,
        );
    });
    document
      .querySelectorAll(".hero, .voice-reel, .fraud, .defiance-wall")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const height = document.documentElement.scrollHeight - innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`;
      const morph = document.getElementById("recusa");
      if (morph)
        typePressure.current = Math.min(
          1,
          Math.max(
            0,
            (innerHeight - morph.getBoundingClientRect().top) / innerHeight,
          ),
        );
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(
              (entry.target as HTMLElement).dataset.chapter || "início",
            );
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );
    document
      .querySelectorAll("[data-chapter]")
      .forEach((el) => observer.observe(el));
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const complete = useCallback(() => {
    setReleased(true);
    setHeld(false);
    setHoldProgress(1);
    pressure.current = 1;
    releaseRef.current();
  }, []);
  useEffect(() => {
    if (!held || released) return;
    let frame = 0,
      start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const value = Math.min(1, (now - start) / 1800);
      pressure.current = value;
      setHoldProgress(value);
      if (value >= 1) complete();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [held, released, complete]);
  const cancel = () => {
    setHeld(false);
    if (!released) {
      pressure.current = 0;
      setHoldProgress(0);
    }
  };
  const reset = () => {
    setReleased(false);
    setHoldProgress(0);
    pressure.current = 0;
  };
  useEffect(() => {
    if (!held) return;
    const interrupt = () => {
      setHeld(false);
      if (!released) {
        pressure.current = 0;
        setHoldProgress(0);
      }
    };
    const visibility = () => {
      if (document.hidden) interrupt();
    };
    addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [held, released]);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        anchors: true,
        smoothWheel: !quiet,
        duration: quiet ? 0 : 1.05,
      }}
    >
      <a href="#manifesto" className="skip-link">
        Pular para o manifesto
      </a>
      <div className="reading-progress" ref={progress} aria-hidden="true" />
      <header className="masthead">
        <a
          href="#inicio"
          className="wordmark"
          aria-label="Nori Studios, início"
        >
          <Asterisk />{" "}
          <span>
            NORI<span className="wordmark-sub">STUDIOS</span>
          </span>
        </a>
        <span className="header-edition">
          EXPRESSÃO NÃO É EXCESSO.
          <br />
          MANIFESTO INDEPENDENTE / 2026
        </span>
        <nav aria-label="Navegação principal">
          <a href="#manifesto">
            O manifesto <ArrowUpRight aria-hidden="true" />
          </a>
          <a href="#ruptura">
            A ruptura <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
        <div className="experience-controls">
          <button
            onClick={() => setMotionOverride(!quiet)}
            aria-pressed={quiet}
            aria-label={quiet ? "Ativar movimento" : "Pausar movimento"}
            title={quiet ? "Ativar movimento" : "Pausar movimento"}
          >
            {quiet ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            <span>Movimento</span>
          </button>
          <button
            onClick={() => void toggle()}
            aria-pressed={sound}
            aria-label={sound ? "Desativar som" : "Ativar som"}
          >
            {sound ? (
              <AudioLines aria-hidden="true" />
            ) : (
              <VolumeX aria-hidden="true" />
            )}
            <span>{sound ? "Som ligado" : "Ativar som"}</span>
          </button>
        </div>
      </header>
      {error && (
        <p role="status" className="audio-error">
          {error}
        </p>
      )}
      <main>
        <section
          className="hero"
          id="inicio"
          data-chapter="início"
          aria-labelledby="hero-title"
        >
          <div className="hero-index micro">
            <span>UM GRITO CONTRA A AUTORREPRESSÃO CRIATIVA</span>
            <span>ESTÉTICA PRÓPRIA. NENHUMA PERMISSÃO.</span>
          </div>
          <div className="hero-collage" aria-hidden="true">
            <Stage paused={quiet} />
            <div className="orbital orbital-one" />
            <div className="orbital orbital-two" />
            <span className="cross cross-a">
              <Plus />
            </span>
            <span className="cross cross-b">
              <Plus />
            </span>
            <RageEcho text="EU NÃO VOU ME APAGAR" />
            <span className="hero-side left">
              TUDO O QUE EU CALEI
              <br />
              AINDA ESTÁ AQUI DENTRO.
            </span>
            <span className="hero-side right">
              O VAZIO NÃO É<br />
              FALTA DE SENTIMENTO.
            </span>
            <span className="void-coordinate">INTERIOR / SEM ESCALA</span>
          </div>
          {!sound && (
            <button className="hero-sound-invite" onClick={() => void toggle()}>
              <Volume2 aria-hidden="true" />
              <span>OUÇA O QUE EU SINTO</span>
            </button>
          )}
          <h1
            id="hero-title"
            aria-label="Eu não vou me diminuir por um padrão industrial."
          >
            <span className="hero-line">
              <KineticText text="EU NÃO VOU" variant="rise" />
            </span>
            <span className="hero-line hero-line-bottom">
              <KineticText text="ME DIMINUIR" variant="stretch" />
              <span className="period">.</span>
            </span>
            <span className="hero-end">
              <KineticText text="POR UM PADRÃO INDUSTRIAL." variant="cut" />
            </span>
          </h1>
          <div className="hero-foot">
            <p>
              Você chama de excesso.
              <br />
              Eu chamo de <em>existir.</em>
            </p>
            <a href="#manifesto" className="enter-link">
              <span>ENTRE NO QUE EU SINTO</span>
              <span className="arrow">
                <ArrowDown aria-hidden="true" />
              </span>
            </a>
            <span className="hero-credit micro">
              DIREÇÃO, SENTIMENTO E RECUSA
              <br />
              <strong>BRENNO LEON / NORI STUDIOS</strong>
            </span>
          </div>
        </section>

        <div
          className="ticker"
          aria-label="A arte não precisa da sua permissão"
        >
          <div aria-hidden="true">
            {[0, 1].map((i) => (
              <span key={i}>
                A ARTE NÃO PRECISA DA SUA PERMISSÃO <Asterisk /> EU NÃO NASCI
                PARA CABER <Asterisk />{" "}
              </span>
            ))}
          </div>
        </div>

        <VoiceReel />
        <section
          className="chapter chapter-one paper"
          id="manifesto"
          data-chapter="01 / condicionamento"
          aria-labelledby="chapter-one-title"
        >
          <div className="section-label">
            <span>01 / O CONDICIONAMENTO</span>
            <span>O PRIMEIRO CORTE É INVISÍVEL.</span>
          </div>
          <h2 className="chapter-heading" id="chapter-one-title">
            <KineticText text="ME ENSINARAM" variant="cut" />
            <br />A{" "}
            <span className="outlined">
              <KineticText text="CABER." variant="stretch" />
            </span>
          </h2>
          <div className="editorial-grid">
            <figure className="sculpture-figure">
              <div className="sculpture-image">
                <img
                  src={`${import.meta.env.BASE_URL}art/sculpture.webp`}
                  alt="Laocoonte e seus filhos presos por serpentes, numa escultura de corpos em tensão."
                  width="1024"
                  height="1077"
                  loading="lazy"
                />
                <div className="engraving" aria-hidden="true" />
                <span className="art-overprint" aria-hidden="true">
                  CONTIDO.
                  <br />
                  NUNCA VAZIO.
                </span>
              </div>
              <figcaption>
                <span>FIG. 01 / UM CORPO NÃO ESQUECE A PRESSÃO.</span>
                <a
                  href="https://artmuseum.princeton.edu/art/collections/objects/30736"
                  target="_blank"
                  rel="noreferrer"
                >
                  Laocoön · domínio público <ArrowUpRight aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
            <ChapterText index={0} />
          </div>
          <div className="footnote">
            <span>UMA PREFERÊNCIA REPETIDA NÃO SE TORNA UMA LEI.</span>
            <Asterisk />
          </div>
        </section>

        <section className="fraud" aria-labelledby="fraud-title">
          <div className="section-label">
            <span>DECLARAÇÃO SEM PEDIDO DE DESCULPAS</span>
            <span>DESOBEDEÇA À COMPOSIÇÃO.</span>
          </div>
          <h2 id="fraud-title">
            <span className="strike-word">
              <KineticText text="MINIMALISMO" variant="cut" />
            </span>
            <span className="fraud-middle">
              <KineticText text="É UMA" variant="rise" />{" "}
              <em>
                <KineticText text="FRAUDE" variant="scatter" />
              </em>
            </span>
            <span className="fraud-last">
              <KineticText text="DIANTE DA ARTE." variant="cut" />
            </span>
          </h2>
          <div className="fraud-note">
            <Asterisk />
            <p>
              Quando uma escolha estética exige que todas as outras desapareçam,
              a elegância vira uma forma de controle.
            </p>
            <span className="micro">
              A MINHA RAIVA
              <br />
              TEM ENDEREÇO.
            </span>
          </div>
        </section>

        <section
          className="chapter chapter-two"
          id="mutilacao"
          data-chapter="02 / mutilação"
          aria-labelledby="chapter-two-title"
        >
          <div className="section-label">
            <span>02 / A MUTILAÇÃO</span>
            <span>APAGAR TAMBÉM DEIXA MARCA.</span>
          </div>
          <div className="editorial-grid machine-grid">
            <div className="machine-art">
              <h2 id="chapter-two-title">
                <KineticText text="QUANTO" variant="stretch" />
                <br />
                <KineticText text="DE VOCÊ" variant="cut" />
                <br />
                <span className="outlined">
                  <KineticText text="SOBROU?" variant="scatter" />
                </span>
              </h2>
              <div
                className="industry-commands"
                aria-label="Exigências da indústria"
              >
                {[
                  "SEJA NEUTRO.",
                  "TIRE O PESO.",
                  "SIGA O PADRÃO.",
                  "NÃO INCOMODE.",
                ].map((line, i) => (
                  <div key={line}>
                    <span className="micro">0{i + 1}</span>
                    <span>{line}</span>
                    <X aria-hidden="true" />
                  </div>
                ))}
              </div>
              <div className="barcode" aria-hidden="true" />
              <span className="micro">
                MODELO APROVADO / IDENTIDADE AUSENTE
              </span>
            </div>
            <ChapterText index={1} />
          </div>
        </section>

        <PressureChamber quiet={quiet} />
        <section
          className="void-chapter"
          id="vazio"
          data-chapter="03 / vazio"
          aria-labelledby="void-title"
        >
          <div className="section-label">
            <span>03 / O VAZIO</span>
            <span>NÃO EXISTE MARGEM NO INFINITO.</span>
          </div>
          <div className="void-scene">
            <Stage paused={quiet} />
            <div className="void-text">
              <span className="micro">VOCÊ SENTE ISSO TAMBÉM?</span>
              <h2 id="void-title">
                <KineticText text="TÃO VASTO." variant="scatter" />
                <br />
                <em>
                  <KineticText text="TÃO PRESO." variant="stretch" />
                </em>
              </h2>
              <span className="micro">
                UM UNIVERSO INTEIRO AQUI DENTRO.
                <br />E EU TENTANDO CABER NUMA TELA LIMPA.
              </span>
            </div>
            <div className="void-measure" aria-hidden="true">
              <Plus />
              <span>SEM ESCALA POSSÍVEL</span>
              <Plus />
            </div>
          </div>
          <div className="void-reading">
            <span className="void-aside">
              O SILÊNCIO
              <br />
              TAMBÉM
              <br />
              <em>ESMAGA.</em>
            </span>
            <ChapterText index={2} />
          </div>
        </section>

        <section
          className="chapter chapter-four"
          id="recusa"
          data-chapter="04 / recusa"
          aria-labelledby="refusal-title"
        >
          <div className="section-label">
            <span>04 / A RECUSA</span>
            <span>A VOZ VOLTA PARA QUEM É DONO DELA.</span>
          </div>
          <h2 id="refusal-title" className="sr-only">
            De obedecer a existir
          </h2>
          <div className="morph-art">
            <Stage kind="type" paused={quiet} pressure={typePressure} />
            <span className="micro">
              OBEDEÇA <ArrowRight aria-hidden="true" /> EXISTA
            </span>
          </div>
          <div className="editorial-grid refusal-grid">
            <div className="refusal-statement">
              <Asterisk />
              <p>
                VOCÊ NÃO
                <br />
                VAI DECIDIR
                <br />
                <span className="outlined">O TAMANHO</span>
                <br />
                DA MINHA VOZ.
              </p>
            </div>
            <ChapterText index={3} />
          </div>
          <div className="declaration-list">
            {declarations.slice(0, 5).map((line, i) => (
              <p key={line}>
                <span className="micro">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span>{line}</span>
                <ArrowUpRight aria-hidden="true" />
              </p>
            ))}
          </div>
        </section>

        <DefianceWall onStrike={strike} />
        <section
          ref={rupture}
          id="ruptura"
          className={`rupture ${held ? "is-holding" : ""} ${released ? "is-released" : ""}`}
          data-chapter="05 / ruptura"
          aria-labelledby="rupture-title"
          style={{ "--pressure": holdProgress } as CSSProperties}
        >
          <div className="section-label">
            <span>05 / A RUPTURA</span>
            <span>É SUA VEZ DE OCUPAR ESPAÇO.</span>
          </div>
          <div className="rupture-field">
            <Stage paused={quiet} pressure={pressure} />
            <div className="containment-lines" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <i key={i} style={{ "--i": i } as CSSProperties} />
              ))}
            </div>
            <div className="rupture-content">
              <span className="micro">
                {released
                  ? "O PADRÃO PERDEU A ÚLTIMA PALAVRA."
                  : "TUDO O QUE FOI ENGOLIDO QUER SAIR."}
              </span>
              <h2 id="rupture-title">
                {released ? (
                  <>
                    <KineticText text="EU QUERO" variant="scatter" />
                    <br />
                    <em>
                      <KineticText text="SER EU." variant="stretch" />
                    </em>
                  </>
                ) : (
                  <>
                    <KineticText text="CHEGA DE" variant="stretch" />
                    <br />
                    <span className="outlined">
                      <KineticText text="ME CALAR." variant="cut" />
                    </span>
                  </>
                )}
              </h2>
              {!released ? (
                <>
                  <button
                    className="break-button"
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      if (!quiet) setHeld(true);
                    }}
                    onPointerUp={cancel}
                    onPointerCancel={cancel}
                    onLostPointerCapture={cancel}
                    onClick={(e) => {
                      if (quiet || e.detail === 0) complete();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancel();
                    }}
                    aria-describedby="hold-help"
                  >
                    <span className="button-fill" aria-hidden="true" />
                    <Asterisk />
                    <span>
                      {quiet
                        ? "ROMPER O PADRÃO"
                        : held
                          ? "NÃO SOLTE. A VOZ É SUA."
                          : "SEGURE PARA ROMPER"}
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </button>
                  <p id="hold-help" className="micro">
                    {quiet
                      ? "ATIVE PARA LIBERTAR A COMPOSIÇÃO."
                      : "SEGURE POR DOIS SEGUNDOS. NO TECLADO, ENTER."}
                  </p>
                  <div
                    className="sr-only"
                    role="progressbar"
                    aria-label="Pressão acumulada"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(holdProgress * 100)}
                  />
                </>
              ) : (
                <div className="release-response">
                  <p role="status">
                    Você não precisa desaparecer para pertencer.
                  </p>
                  <button className="text-button" onClick={reset}>
                    Sentir de novo <RotateCcw aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="afterword paper" aria-labelledby="afterword-title">
          <div className="section-label">
            <span>DEPOIS DO GRITO, AINDA EXISTE ALGUÉM.</span>
            <span>UM MANIFESTO ABERTO.</span>
          </div>
          <div className="afterword-grid">
            <h2 id="afterword-title">
              <KineticText text="EU AINDA" variant="cut" />
              <br />
              ESTOU{" "}
              <em>
                <KineticText text="AQUI." variant="scatter" />
              </em>
            </h2>
            <div className="afterword-copy">
              {closing.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="signature">
                Brenno Leon de Souza Amaral
                <span>Nori Studios / direção e sentimento</span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <span className="micro">
            FEITO PARA SENTIR.
            <br />
            NÃO PARA SE ADEQUAR.
          </span>
          <a href="#inicio">
            Voltar à superfície <ArrowUp aria-hidden="true" />
          </a>
          <span className="micro">
            BRENNO LEON
            <br />
            NORI STUDIOS © 2026
          </span>
        </div>
        <div className="footer-word" aria-hidden="true">
          <KineticText text="SEM PERMISSÃO" variant="cut" />
          <Asterisk />
        </div>
        <div className="footer-bottom micro">
          <span>ARTE, CÓDIGO E INCONFORMISMO.</span>
          <span aria-live="off">{active}</span>
          <span>EU NÃO VOU ME DIMINUIR.</span>
        </div>
      </footer>
      {sound && (
        <aside className="sound-dock" aria-label="Controles de áudio">
          <button onClick={() => void toggle()} aria-label="Silenciar trilha">
            <VolumeX aria-hidden="true" />
          </button>
          <label className="sound-range">
            <Volume2 aria-hidden="true" />
            <span className="sr-only">Volume do som</span>
            <input
              aria-label="Volume do som"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <output>{volume}%</output>
          </label>
        </aside>
      )}
      <div className="grain" aria-hidden="true" />
    </ReactLenis>
  );
}
export default App;
