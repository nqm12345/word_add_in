import axios from 'axios';
import { API_BASE, WEBDAV_BASE } from '../config';

/**
 * API Service for file operations
 * 
 * CẬP NHẬT: Sử dụng fileId thay vì filename để tránh conflict
 */

export async function getDocuments() {
    const response = await axios.get(`${API_BASE}/documents`);
    return response.data;
}

export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
}

export async function deleteDocument(fileId) {
    // Sử dụng ID thay vì filename
    const response = await axios.delete(`${API_BASE}/documents/id/${fileId}`);
    return response.data;
}

export function getDownloadUrl(fileId, filename) {
    // URL mới: /documents/id/:fileId/:filename
    return `${API_BASE}/documents/id/${fileId}/${encodeURIComponent(filename)}`;
}

/**
 * Tạo WebDAV URL với fileId
 * Format mới: /id/:fileId/:filename
 * Đảm bảo Word mở đúng file kể cả khi có nhiều file trùng tên
 */
export function getWebDAVUrl(fileId, filename) {
    return `${WEBDAV_BASE}/id/${fileId}/${encodeURIComponent(filename)}`;
}

/**
 * Tạo URL mở Word Desktop
 * Sử dụng fileId để tìm chính xác file
 */
export function getMsWordUrl(fileId, filename) {
    const webdavUrl = getWebDAVUrl(fileId, filename);
    return `ms-word:ofe|u|${webdavUrl}`;
}

/**
 * Lấy tất cả versions của một file
 */
export async function getFileVersions(parentId) {
    const response = await axios.get(`${API_BASE}/documents/${parentId}/versions`);
    return response.data;
}
