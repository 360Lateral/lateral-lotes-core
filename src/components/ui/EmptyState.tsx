import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) => (
  <Card className={`p-6 border-dashed flex flex-col items-center text-center gap-2 ${className}`}>
    {Icon && (
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
    )}
    <p className="font-medium text-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </Card>
);

export default EmptyState;
