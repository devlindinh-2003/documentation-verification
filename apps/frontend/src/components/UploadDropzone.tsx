'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { mapErrorToMessage } from '../lib/error-messages';

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  disabledMessage?: string;
}

export function UploadDropzone({ onUpload, disabled, disabledMessage }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: disabled || uploading,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(file);
      setSuccess(true);
      setFile(null);
    } catch (err: unknown) {
      setError(mapErrorToMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/50'}
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
          ${file ? 'border-primary bg-primary/5' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="p-10 flex flex-col items-center text-center">
          {file ? (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center border border-primary/20">
                <File className="text-primary" size={32} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 font-medium">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={removeFile}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Upload
                  className="text-slate-400 group-hover:text-white transition-colors"
                  size={32}
                />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-900">
                  {isDragActive ? 'Drop your document here' : 'Upload your document'}
                </p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Drag and drop your document here, or click to browse.
                </p>
                <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500" /> PDF, JPG, PNG
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500" /> Max 10MB
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {disabled && disabledMessage && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              {disabledMessage}
            </p>
          </div>
        )}
      </div>

      {file && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-4 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200"
        >
          Confirm & Submit Document
        </button>
      )}

      {uploading && (
        <div className="w-full py-4 bg-primary/10 text-primary font-semibold rounded-2xl flex items-center justify-center gap-3">
          <Loader2 className="animate-spin" size={20} />
          Uploading to Secure Storage...
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={20} className="text-green-500" />
          <span className="text-sm font-semibold">
            Document submitted successfully! Reviewing now...
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
    </div>
  );
}
