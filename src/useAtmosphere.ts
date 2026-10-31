import { useCallback, useEffect, useRef, useState } from "react";
import { Atmosphere } from "./audio";

export default function useAtmosphere() {
  const [sound, setSound] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolumeState] = useState(45);
  const volumeRef = useRef(45);
  const audio = useRef<Atmosphere | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);

  const toggle = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      if (audio.current) {
        const current = audio.current;
        audio.current = null;
        await current.close();
        if (mounted.current) setSound(false);
        return;
      }
      const current = new Atmosphere(volumeRef.current);
      audio.current = current;
      await current.start();
      if (!mounted.current || audio.current !== current) {
        await current.close();
        return;
      }
      setSound(true);
      setError("");
    } catch {
      const current = audio.current;
      audio.current = null;
      await current?.close().catch(() => undefined);
      if (mounted.current) {
        setSound(false);
        setError(
          "O navegador não conseguiu iniciar o som. Tente ativá-lo novamente.",
        );
      }
    } finally {
      pending.current = false;
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    const next = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    volumeRef.current = next;
    setVolumeState(next);
    audio.current?.setVolume(next);
  }, []);
  const release = useCallback(() => audio.current?.release(), []);
  const strike = useCallback(() => audio.current?.strike(), []);

  useEffect(() => {
    mounted.current = true;
    const visibility = () => audio.current?.setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
      const current = audio.current;
      audio.current = null;
      void current?.close().catch(() => undefined);
    };
  }, []);

  return { sound, error, toggle, release, volume, setVolume, strike };
}
