import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EnviarFeedbackDialog from "@/components/feedback/EnviarFeedbackDialog";

export const PUBLIC_MOBILE_ACTION_PATHS = ["/", "/planes", "/resolutoria", "/diagnostico", "/nosotros", "/contacto", "/unsubscribe"];

/**
 * Contenedor único para botones flotantes de la esquina inferior derecha.
 * Cualquier botón flotante nuevo debe ir aquí dentro (sin clases `fixed` propias)
 * para evitar superposiciones.
 */
const FloatingActionStack = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const affectedPage = pathname === "/mercado" || /^\/lotes\/[^/]+$/.test(pathname)
    || PUBLIC_MOBILE_ACTION_PATHS.includes(pathname);

  if (isMobile && affectedPage) {
    return (
      <>
        <div className="fixed bottom-6 right-6 z-50">
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shadow-lg" aria-label="Abrir acciones" title="Abrir acciones">
                <Plus className={`h-6 w-6 transition-transform motion-reduce:transition-none ${menuOpen ? "rotate-45" : ""}`} />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-48 space-y-1 p-2">
              {user && (
                <Button variant="ghost" className="min-h-12 min-w-12 w-full justify-start" onClick={() => { setMenuOpen(false); setFeedbackOpen(true); }} aria-label="Enviar feedback">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Feedback
                </Button>
              )}
              <Button variant="ghost" className="min-h-12 min-w-12 w-full justify-start" asChild>
                <Link to="/" onClick={() => setMenuOpen(false)} title="Volver al inicio">
                  <Home className="mr-2 h-5 w-5" />
                  Inicio
                </Link>
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <EnviarFeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      </>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 [&>*]:pointer-events-auto">
      {children}
    </div>
  );
};

export default FloatingActionStack;
