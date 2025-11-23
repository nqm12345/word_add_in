import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { FILE_TYPES } from '../config';

export default function UploadForm({ onUpload, loading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(FILE_TYPES.ALLOWED[0])) {
        alert(`Chỉ chấp nhận file ${FILE_TYPES.ALLOWED.join(', ')}`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Upload className="w-5 h-5 mr-2" />
        Upload File Word
      </h2>
      
      <div className="flex items-center space-x-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_TYPES.ALLOWED.join(',')}
          onChange={handleFileSelect}
          className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        
        {selectedFile && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 px-3 py-2 bg-gray-100 rounded-lg">
              {selectedFile.name}
            </span>
            
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Đang upload...' : 'Upload'}</span>
            </button>
            
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
