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
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
        ${isDragActive
          ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {/* Upload icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}
        >
          <svg className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 0 1 8 0m-4-4a4 4 0 1 1 8 0m-9 3a6 6 0 1 1 12 0m-2 0a4 4 0 1 1 8 0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10l-2.5 2.5M6.5 15.5L4 18m14-2.5l2.5 2.5M6.5 6.5L4 4" />
          </svg>
        </div>

        {isDragActive ? (
          <p className="text-blue-600 font-semibold text-lg">Soltar archivos aquí...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-semibold text-lg mb-1">Arrastra archivos aquí</p>
            <p className="text-gray-400 text-sm">o haz click para seleccionar</p>
            <p className="text-xs text-gray-400 mt-3">
              PDF, Word, Excel, PowerPoint, imágenes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
