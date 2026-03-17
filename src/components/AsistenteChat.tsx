import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Send, Lock } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LoteContext {
  nombre_lote: string;
  ciudad: string | null;
  departamento: string | null;
  area_total_m2: number | null;
  uso_principal: string | null;
  indice_construccion: number | null;
  indice_ocupacion: number | null;
  altura_max_pisos: number | null;
  altura_max_metros: number | null;
  zona_pot: string | null;
  tratamiento: string | null;
  norma_vigente: string | null;
  score_juridico: number | null;
  score_normativo: number | null;
  score_servicios: number | null;
  notas: string | null;
}

interface Props {
  loteId: string;
  loteContext: LoteContext;
}

const WELCOME_MESSAGE =
  "Hola, soy el Asistente 360°. Puedo responder tus preguntas sobre este lote: normativa, restricciones, potencial de desarrollo y más. ¿En qué te ayudo?";

const SUGGESTIONS = [
  "¿Cuántos pisos puedo construir aquí?",
  "¿Tiene restricciones ambientales?",
  "¿Cuál es el mayor uso de este lote?",
];

const AsistenteChat = ({ loteId, loteContext }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-lote", {
        body: { messages: updated, loteContext },
      });

      if (error) throw error;

      const respuesta = data?.respuesta ?? "No pude generar una respuesta.";
      const assistantMsg: ChatMessage = { role: "assistant", content: respuesta };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save to consultas_ia
      if (user) {
        await supabase.from("consultas_ia" as any).insert({
          lote_id: loteId,
          user_id: user.id,
          pregunta: text.trim(),
          respuesta,
        } as any);
      }
    } catch (err) {
      console.error("Error chat-lote:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error al procesar tu consulta. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 flex flex-col items-center gap-3 text-center">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">
          Inicia sesión para usar el Asistente 360°
        </p>
        <Button variant="default" size="sm" asChild>
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-secondary text-secondary hover:bg-secondary/5"
        >
          <span className="flex items-center gap-2 font-body text-sm font-semibold">
            <MessageCircle className="h-4 w-4" />
            Pregúntale al Asistente 360°
          </span>
          <span className="text-xs">{open ? "▲" : "▼"}</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="h-[300px] overflow-y-auto bg-muted p-3 flex flex-col gap-3"
          >
            {/* Welcome message */}
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-body text-xs font-bold">
                360°
              </div>
              <div className="rounded-lg bg-background p-3 font-body text-sm text-foreground shadow-sm">
                {WELCOME_MESSAGE}
              </div>
            </div>

            {/* Suggestions (only if no messages yet) */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 ml-10">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-primary bg-background px-3 py-1.5 font-body text-xs text-primary hover:bg-primary/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "items-start gap-2 max-w-[85%]"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-body text-xs font-bold">
                    360°
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 font-body text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground max-w-[75%]"
                      : "bg-background text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-body text-xs font-bold">
                  360°
                </div>
                <div className="rounded-lg bg-background p-3 shadow-sm flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2 border-t border-border bg-background p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 font-body text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={loading}
            />
            <Button
              variant="default"
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AsistenteChat;
