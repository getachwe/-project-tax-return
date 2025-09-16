import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FilePlus, Loader2 } from "lucide-react";

interface UploadDropzoneProps {
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  selectedFile: File | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileUpload,
  isLoading,
  selectedFile,
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      await onFileUpload(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 min-h-[180px] lg:min-h-[220px] xl:min-h-[240px]
        ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-500 hover:shadow-md"
        }
        ${isLoading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center h-full">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-gray-600">מעבד קובץ...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FilePlus className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 mb-2">גרור קובץ לכאן</p>
              <p className="text-sm text-gray-500">או לחץ לבחירת קובץ</p>
              <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG • 50MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
