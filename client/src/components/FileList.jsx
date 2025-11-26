import { Edit, Download, Trash2, RefreshCw, FileText, Calendar, HardDrive, GitBranch } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/formatters';

/**
 * Component hiển thị danh sách files với version tracking
 * 
 * Props:
 * - files: Array of file objects from MongoDB
 * - onEdit(fileId, filename): Mở file trong Word
 * - onDownload(fileId, filename): Tải file về
 * - onDelete(fileId, filename): Xóa file
 */
export default function FileList({ files, loading, onEdit, onDownload, onDelete, onRefresh }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Danh Sách File ({files.length})
        </h2>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && files.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách file...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chưa có file nào</p>
          <p className="text-gray-500 text-sm mt-2">Upload file .docx để bắt đầu</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tên File</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Version</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kích thước</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày upload</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => {
                // Lấy version từ metadata (mặc định là 1)
                const version = file.metadata?.version || 1;
                const isLatest = file.metadata?.isLatest !== false;
                
                return (
                  <tr
                    key={file._id || index}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!isLatest ? 'opacity-60' : ''}`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-medium text-gray-800">{file.filename}</span>
                          {isLatest && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Mới nhất
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <GitBranch className="w-4 h-4" />
                        <span className="font-mono">v{version}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatFileSize(file.length)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onEdit(file._id, file.filename)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
                          title={`Chỉnh sửa version ${version} trong Word Desktop`}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Chỉnh sửa</span>
                        </button>
                        
                        <button
                          onClick={() => onDownload(file._id, file.filename)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
                          title={`Tải xuống version ${version}`}
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải xuống</span>
                        </button>
                        
                        <button
                          onClick={() => onDelete(file._id, file.filename)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 text-sm"
                          title={`Xóa version ${version}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
