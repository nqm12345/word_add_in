import axios from 'axios';
import { API_BASE, WEBDAV_BASE } from '../config';

/**
 * API Service for file operations
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

export async function deleteDocument(filename) {
    const response = await axios.delete(`${API_BASE}/documents/${encodeURIComponent(filename)}`);
    return response.data;
}

export function getDownloadUrl(filename) {
    return `${API_BASE}/documents/${encodeURIComponent(filename)}`;
}

export function getWebDAVUrl(filename) {
    return `${WEBDAV_BASE}/${encodeURIComponent(filename)}`;
}

export function getMsWordUrl(filename) {
    const webdavUrl = getWebDAVUrl(filename);
    return `ms-word:ofe|u|${webdavUrl}`;
}
