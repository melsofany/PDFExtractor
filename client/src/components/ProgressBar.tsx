import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  progress: number;
  currentPage: number;
  totalPages: number;
}

export function ProgressBar({ progress, currentPage, totalPages }: ProgressBarProps) {
  return (
    <Card className="p-6" data-testid="progress-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="font-semibold text-foreground" data-testid="text-progress-status">
                جاري معالجة الملف...
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-page-count">
                {progress < 100 ? 'جاري الرفع...' : 'جاري استخراج البيانات...'}
              </p>
            </div>
          </div>
        </div>
        <div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          <p className="text-sm text-muted-foreground mt-2 text-center" data-testid="text-progress-percentage">
            {progress.toFixed(0)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
