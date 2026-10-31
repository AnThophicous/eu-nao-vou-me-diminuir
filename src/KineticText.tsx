import { memo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface KineticTextProps {
  text: string;
  variant?: "rise" | "stretch" | "scatter" | "cut";
  className?: string;
}

/** Each word keeps its natural width. Only its painted letters move. */
function KineticText({
  text,
  variant = "rise",
  className = "",
}: KineticTextProps) {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = root.current!;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("in-view", entry.isIntersecting);
        if (entry.isIntersecting) el.classList.add("is-seen");
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  let index = 0;
  return (
    <span
      ref={root}
      className={`kinetic kinetic--${variant} ${className}`}
      aria-label={text}
    >
      <span aria-hidden="true">
        {text.split(" ").map((word, w) => (
          <span className="kinetic-unit" key={w}>
            <span className="kinetic-word">
              {Array.from(word).map((letter, l) => {
                const i = index++;
                return (
                  <span
                    className="kinetic-glyph"
                    key={l}
                    style={
                      {
                        "--char": i,
                        "--angle": ((i * 17) % 31) - 15,
                        "--direction": i % 2 ? 1 : -1,
                      } as CSSProperties
                    }
                  >
                    {letter}
                  </span>
                );
              })}
            </span>
            {w < text.split(" ").length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </span>
  );
}
export default memo(KineticText);
