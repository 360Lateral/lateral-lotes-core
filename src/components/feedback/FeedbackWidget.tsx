import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EnviarFeedbackDialog from "./EnviarFeedbackDialog";

const FeedbackWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-lg transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-xl"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <EnviarFeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FeedbackWidget;
