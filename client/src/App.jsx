import { useState, useEffect } from 'react';
import Header from './components/Header';
import FileList from './components/FileList';
import UploadForm from './components/UploadForm';
import StatusMessage from './components/StatusMessage';
import * as api from './services/api';
import { STATUS_TIMEOUT } from './config';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const documents = await api.getDocuments();
      setFiles(documents);
    } catch (error) {
      showStatus('Lỗi tải danh sách file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      setLoading(true);
      await api.uploadDocument(file);
      showStatus('Upload thành công!', 'success');
      await loadFiles();
    } catch (error) {
      showStatus('Lỗi upload file', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mở file trong Word Desktop
   * Sử dụng fileId để tìm chính xác file (tránh conflict khi trùng tên)
   */
  const handleEdit = (fileId, filename) => {
    const msWordUrl = api.getMsWordUrl(fileId, filename);
    window.location.href = msWordUrl;
    showStatus(`Đang mở ${filename} trong Word...`, 'success');
  };

  /**
   * Tải file về máy
   */
  const handleDownload = (fileId, filename) => {
    const downloadUrl = api.getDownloadUrl(fileId, filename);
    window.open(downloadUrl, '_blank');
    showStatus('Đang tải file...', 'info');
  };

  /**
   * Xóa file (chỉ xóa version này, không xóa các versions khác)
   */
  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Bạn có chắc muốn xóa file "${filename}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteDocument(fileId);
      showStatus('Xóa file thành công!', 'success');
      await loadFiles();
    } catch (error) {
      showStatus('Lỗi xóa file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), STATUS_TIMEOUT);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <UploadForm onUpload={handleUpload} loading={loading} />

        {status.message && (
          <StatusMessage message={status.message} type={status.type} />
        )}

        <FileList
          files={files}
          loading={loading}
          onEdit={handleEdit}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRefresh={loadFiles}
        />
      </main>

      <footer className="text-center py-6 text-gray-600 text-sm">
        <p>Word Editor with WebDAV &amp; MongoDB • Made with ❤️ for seamless editing</p>
      </footer>
    </div>
  );
}

export default App;
