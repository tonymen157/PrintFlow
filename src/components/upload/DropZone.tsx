import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../../store/appStore';

export function DropZone() {
  const addFiles = useAppStore((s) => s.addFiles);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addFiles(acceptedFiles);
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif', '.webp', '.heic'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600">Soltar archivos aqui...</p>
      ) : (
        <div>
          <p className="text-gray-600 mb-1">Arrastrar archivos o click para seleccionar</p>
          <p className="text-xs text-gray-400">PDF, Word, Excel, PowerPoint, imágenes</p>
        </div>
      )}
    </div>
  );
}
