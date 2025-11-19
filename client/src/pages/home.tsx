import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/FileUpload";
import { ProgressBar } from "@/components/ProgressBar";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { StatusMessage } from "@/components/StatusMessage";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import type { ExtractedData } from "@shared/schema";
import { exportToExcel, generateFilename } from "@/lib/excelExporter";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Process PDF mutation using React Query
  const processPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest to track upload progress
      return new Promise<ExtractedData>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.min(percentComplete, 99));
          }
        });

        xhr.addEventListener("load", () => {
          setUploadProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error("فشل تحليل الاستجابة"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "فشل معالجة الملف"));
            } catch {
              reject(new Error("فشل معالجة الملف"));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("فشل الاتصال بالخادم"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("تم إلغاء العملية"));
        });

        xhr.open("POST", "/api/process-pdf");
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setStatusMessage({
        type: "success",
        title: "تم الاستخراج بنجاح",
        message: `تم استخراج بيانات ${data.totalVoters} ناخب من ${data.totalCommittees} لجنة`,
      });
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      setStatusMessage({
        type: "error",
        title: "خطأ في المعالجة",
        message: error.message,
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatusMessage(null);
    setExtractedData(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setStatusMessage(null);
    setUploadProgress(0);
  };

  const handleProcessFile = () => {
    if (!selectedFile) return;
    setStatusMessage(null);
    processPdfMutation.mutate(selectedFile);
  };

  const handleExportToExcel = async () => {
    if (!extractedData) return;

    try {
      setStatusMessage({
        type: "info",
        title: "جاري التصدير...",
        message: "سيتم تحميل ملف Excel خلال لحظات",
      });

      const filename = generateFilename();
      await exportToExcel(extractedData, filename);

      setStatusMessage({
        type: "success",
        title: "تم التصدير بنجاح",
        message: `تم تحميل الملف: ${filename}`,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        title: "خطأ في التصدير",
        message: "حدث خطأ أثناء تصدير البيانات إلى Excel",
      });
    }
  };

  const handleClearData = () => {
    setExtractedData(null);
    setStatusMessage(null);
    setUploadProgress(0);
  };

  // Calculate estimated pages for progress display
  const estimatedPages = selectedFile 
    ? Math.max(1, Math.ceil(selectedFile.size / 50000)) 
    : 0;
  const currentPage = Math.floor((uploadProgress / 100) * estimatedPages);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            استخراج بيانات اللجان الانتخابية
          </h1>
          <p className="text-muted-foreground mt-2">
            قم برفع ملف PDF لاستخراج بيانات اللجان والناخبين وتصديرها إلى Excel
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {statusMessage && (
            <StatusMessage
              type={statusMessage.type}
              title={statusMessage.title}
              message={statusMessage.message}
              onDismiss={() => setStatusMessage(null)}
            />
          )}

          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClearFile={handleClearFile}
            isProcessing={processPdfMutation.isPending}
          />

          {selectedFile && !processPdfMutation.isPending && !extractedData && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleProcessFile}
                data-testid="button-process-file"
              >
                <Download className="w-5 h-5 ml-2" />
                بدء المعالجة
              </Button>
            </div>
          )}

          {processPdfMutation.isPending && (
            <ProgressBar
              progress={uploadProgress}
              currentPage={currentPage}
              totalPages={estimatedPages}
            />
          )}

          {extractedData && (
            <>
              <DataPreviewTable data={extractedData} />

              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  onClick={handleExportToExcel}
                  data-testid="button-export-excel"
                >
                  <Download className="w-5 h-5 ml-2" />
                  تصدير إلى Excel
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleClearData}
                  data-testid="button-clear-data"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  مسح البيانات
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
