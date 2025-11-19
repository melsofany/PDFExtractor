import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusMessageProps {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function StatusMessage({ type, title, message, onDismiss }: StatusMessageProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const variants = {
    success: "default" as const,
    error: "destructive" as const,
    info: "default" as const,
  };

  const testIds = {
    success: "alert-success",
    error: "alert-error",
    info: "alert-info",
  };

  return (
    <Alert variant={variants[type]} className="mb-6" data-testid={testIds[type]}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[type]}</div>
          <div className="flex-1">
            <AlertTitle className="mb-1" data-testid="text-alert-title">{title}</AlertTitle>
            <AlertDescription data-testid="text-alert-message">{message}</AlertDescription>
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
            data-testid="button-dismiss-alert"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
