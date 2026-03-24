import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FilePlus, Loader2, Pencil } from "lucide-react";

interface UploadDropzoneProps {
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  selectedFile: File | null;
  onManualEntry: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileUpload,
  isLoading,
  selectedFile,
  onManualEntry,
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      await onFileUpload(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true, // we provide our own click target
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300",
        "min-h-[160px] sm:min-h-[180px]",
        isDragActive
          ? "border-blue-500 bg-blue-50/60"
          : "border-border bg-card hover:border-blue-400 hover:bg-muted/30 hover:shadow-sm",
        isLoading ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center h-full">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-muted-foreground">מעלה ומנתח את הקובץ…</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
              <FilePlus className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="btn-secondary rounded-xl px-4 py-2 text-sm"
            >
              החלף קובץ
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center border border-blue-200 shrink-0">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              PDF / JPG / PNG · עד 10MB · קובץ אחד
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="h-11 sm:h-12 px-6 btn-primary rounded-xl text-sm font-medium"
              >
                העלאת קובץ
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManualEntry();
                }}
                className="h-11 sm:h-12 px-6 btn-secondary rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <Pencil className="h-5 w-5 shrink-0" />
                הזנה ידנית
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
