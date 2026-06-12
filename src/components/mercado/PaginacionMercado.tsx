import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  total: number;
  currentPage: number;
  pageSize: number;
  onChange: (p: number) => void;
}

const PaginacionMercado = ({ total, currentPage, pageSize, onChange }: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onChange(currentPage + 1)}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default PaginacionMercado;
