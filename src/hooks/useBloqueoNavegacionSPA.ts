import { useEffect, useRef } from "react";

interface Options {
  hayCambiosSinGuardar: boolean;
  /** Callback que se ejecuta cuando el usuario confirma salir SIN guardar */
  onSalirSinGuardar?: () => void;
  mensaje?: string;
}

/**
 * Bloqueo de navegación para SPAs que aún usan <BrowserRouter> clásico
 * (sin data router). Estrategia:
 *
 * 1. Patch de history.pushState / replaceState para interceptar navegación
 *    programática (incluye <Link> de react-router, que usa pushState).
 * 2. Listener de popstate para back/forward.
 * 3. beforeunload para cierre de pestaña / recarga.
 *
 * Si en el futuro se migra a createBrowserRouter, conviene reemplazar este
 * hook por uno basado en useBlocker.
 */
export const useBloqueoNavegacionSPA = ({
  hayCambiosSinGuardar,
  onSalirSinGuardar,
  mensaje = "Tienes cambios sin guardar. ¿Salir de todos modos?",
}: Options) => {
  const onSalirRef = useRef(onSalirSinGuardar);
  const mensajeRef = useRef(mensaje);

  useEffect(() => {
    onSalirRef.current = onSalirSinGuardar;
    mensajeRef.current = mensaje;
  }, [onSalirSinGuardar, mensaje]);

  // beforeunload: cierre de pestaña / recarga
  useEffect(() => {
    if (!hayCambiosSinGuardar) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hayCambiosSinGuardar]);

  // Patch de history + popstate: navegación SPA
  useEffect(() => {
    if (!hayCambiosSinGuardar) return;

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    const wrap =
      (orig: typeof origPush) =>
      (...args: Parameters<typeof origPush>) => {
        const confirmado = window.confirm(mensajeRef.current);
        if (confirmado) {
          onSalirRef.current?.();
          return orig(...args);
        }
        // Cancelado: no navegamos.
      };

    window.history.pushState = wrap(origPush) as typeof window.history.pushState;
    window.history.replaceState = wrap(origReplace) as typeof window.history.replaceState;

    // popstate (back/forward): si el usuario cancela, re-empujamos al estado actual.
    const currentHref = window.location.href;
    const popHandler = () => {
      const confirmado = window.confirm(mensajeRef.current);
      if (confirmado) {
        onSalirRef.current?.();
      } else {
        // Re-push al estado anterior usando la función ORIGINAL (sin prompt).
        origPush(null, "", currentHref);
      }
    };
    window.addEventListener("popstate", popHandler);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener("popstate", popHandler);
    };
  }, [hayCambiosSinGuardar]);
};
