const API_BASE = 'https://localhost:3000/api';

let currentFileName = '';

// Khởi tạo - chạy cả trong browser và Word
function initializeApp() {
    console.log('App đã sẵn sàng');
    
    // Gắn sự kiện cho các button
    document.getElementById('refreshBtn').onclick = loadFileList;
    document.getElementById('saveBtn').onclick = saveToServer;
    document.getElementById('uploadBtn').onclick = uploadFile;
    
    // Tải danh sách file khi khởi động
    loadFileList();
}

// Kiểm tra nếu có Office.js (trong Word Add-in)
if (typeof Office !== 'undefined') {
    Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
            console.log('Word Add-in đã sẵn sàng');
            initializeApp();
        }
    });
} else {
    // Chạy trong browser thuần
    console.log('Chạy trong browser');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
}

// Hiển thị thông báo
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
}

// Tải danh sách file từ server
async function loadFileList() {
    const fileListDiv = document.getElementById('fileList');
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách file...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/documents`);
        if (!response.ok) throw new Error('Không thể tải danh sách file');
        
        const documents = await response.json();
        
        if (documents.length === 0) {
            fileListDiv.innerHTML = '<div class="loading">Chưa có file nào trên server</div>';
            return;
        }
        
        fileListDiv.innerHTML = '';
        documents.forEach(doc => {
            const fileItem = createFileItem(doc);
            fileListDiv.appendChild(fileItem);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách file:', error);
        fileListDiv.innerHTML = '<div class="loading">❌ Lỗi kết nối server</div>';
        showStatus('Không thể tải danh sách file', 'error');
    }
}

// Tạo phần tử file trong danh sách
function createFileItem(doc) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const fileSize = (doc.size / 1024).toFixed(2);
    const fileDate = new Date(doc.modified).toLocaleString('vi-VN');
    
    div.innerHTML = `
        <div class="file-name">📄 ${doc.name}</div>
        <div class="file-info">Kích thước: ${fileSize} KB | Sửa đổi: ${fileDate}</div>
        <div class="file-actions">
            <button class="btn btn-success open-btn" data-filename="${doc.name}">
                📂 Mở trong Word
            </button>
            <button class="btn btn-danger delete-btn" data-filename="${doc.name}">
                🗑️ Xóa
            </button>
        </div>
    `;
    
    // Gắn sự kiện cho nút "Mở"
    const openBtn = div.querySelector('.open-btn');
    openBtn.onclick = () => openDocument(doc.name);
    
    // Gắn sự kiện cho nút "Xóa"
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.onclick = () => deleteDocument(doc.name);
    
    return div;
}

// Mở file từ server vào Word
async function openDocument(filename) {
    showStatus(`Đang mở file ${filename}...`, 'info');
    
    try {
        // Lấy nội dung file từ server (Base64)
        const response = await fetch(`${API_BASE}/documents/${filename}/content`);
        if (!response.ok) throw new Error('Không thể tải file');
        
        const data = await response.json();
        
        // Chèn nội dung vào Word document
        await Word.run(async (context) => {
            // Xóa nội dung hiện tại
            const body = context.document.body;
            body.clear();
            
            // Chèn file OOXML (Word format)
            body.insertFileFromBase64(data.content, Word.InsertLocation.replace);
            
            await context.sync();
            
            // Lưu tên file hiện tại
            currentFileName = filename;
            document.getElementById('filename').value = filename;
            
            showStatus(`✅ Đã mở file ${filename} thành công!`, 'success');
        });
    } catch (error) {
        console.error('Lỗi mở file:', error);
        showStatus(`❌ Không thể mở file ${filename}`, 'error');
    }
}

// Lưu document hiện tại lên server
async function saveToServer() {
    const filename = document.getElementById('filename').value.trim();
    
    if (!filename) {
        showStatus('❌ Vui lòng nhập tên file', 'error');
        return;
    }
    
    // Đảm bảo có đuôi .docx
    const finalFilename = filename.endsWith('.docx') ? filename : filename + '.docx';
    
    showStatus(`Đang lưu file ${finalFilename}...`, 'info');
    
    try {
        await Word.run(async (context) => {
            // Lấy nội dung document dưới dạng base64
            const documentBody = context.document.body;
            const fileContent = documentBody.getOoxml();
            
            await context.sync();
            
            // Chuyển OOXML sang base64
            const base64Content = fileContent.value;
            
            // Chuyển base64 thành binary
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Gửi lên server
            const response = await fetch(`${API_BASE}/documents/${finalFilename}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                body: bytes
            });
            
            if (!response.ok) throw new Error('Không thể lưu file');
            
            const result = await response.json();
            showStatus(`✅ ${result.message}`, 'success');
            
            // Cập nhật lại danh sách file
            loadFileList();
            currentFileName = finalFilename;
        });
    } catch (error) {
        console.error('Lỗi lưu file:', error);
        showStatus(`❌ Không thể lưu file: ${error.message}`, 'error');
    }
}

// Upload file mới lên server
async function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('❌ Vui lòng chọn file để upload', 'error');
        return;
    }
    
    showStatus(`Đang upload file ${file.name}...`, 'info');
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Không thể upload file');
        
        const result = await response.json();
        showStatus(`✅ ${result.message}`, 'success');
        
        // Reset input và tải lại danh sách
        fileInput.value = '';
        loadFileList();
    } catch (error) {
        console.error('Lỗi upload file:', error);
        showStatus(`❌ Không thể upload file`, 'error');
    }
}

// Xóa file từ server
async function deleteDocument(filename) {
    if (!confirm(`Bạn có chắc muốn xóa file "${filename}"?`)) {
        return;
    }
    
    showStatus(`Đang xóa file ${filename}...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE}/documents/${filename}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Không thể xóa file');
        
        const result = await response.json();
        showStatus(`✅ ${result.message}`, 'success');
        
        // Tải lại danh sách file
        loadFileList();
        
        // Nếu file đang mở bị xóa, xóa tên file trong input
        if (currentFileName === filename) {
            currentFileName = '';
            document.getElementById('filename').value = '';
        }
    } catch (error) {
        console.error('Lỗi xóa file:', error);
        showStatus(`❌ Không thể xóa file`, 'error');
    }
}
