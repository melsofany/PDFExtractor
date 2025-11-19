import { useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, selectedFile, onClearFile, isProcessing }: FileUploadProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files && files[0] && files[0].type === "application/pdf") {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " بايت";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " كيلوبايت";
    return (bytes / (1024 * 1024)).toFixed(2) + " ميجابايت";
  };

  return (
    <Card className="p-6">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            data-testid="input-file-upload"
            disabled={isProcessing}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  اسحب ملف PDF هنا أو انقر للاختيار
                </p>
                <p className="text-sm text-muted-foreground">
                  يدعم ملفات PDF فقط (الحجم الأقصى: 100 ميجابايت)
                </p>
              </div>
            </div>
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-accent rounded-lg" data-testid="selected-file-info">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground" data-testid="text-filename">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-filesize">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFile}
              data-testid="button-clear-file"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
