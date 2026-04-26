'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
}

export function UploadDropzone({ onUpload }: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File) => {
    setError('');
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return false;
    }
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Must be a PDF, JPEG, or PNG');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div
        className={`relative flex flex-col items-center justify-center p-10 mt-4 border-2 border-dashed rounded-xl transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4">
              <UploadCloud size={32} />
            </div>
            <p className="text-lg font-medium text-slate-700">Drag & drop your document</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
            <p className="text-xs text-slate-400 mt-4">Supports PDF, JPEG, PNG up to 10MB</p>
          </>
        ) : (
          <div className="flex items-center justify-between w-full p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FileIcon className="text-blue-500" size={24} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              disabled={uploading}
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {file && (
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Submit Document'}
        </button>
      )}
    </div>
  );
}
