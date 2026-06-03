import { apiRequest } from './api';

import type {
    DocumentDetailItem,
    DocumentItem,
} from '../types/document';

export async function getDocuments(): Promise<DocumentItem[]> {
    return apiRequest<DocumentItem[]>('/documents/');
}

export async function getDocumentById(documentId: number): Promise<DocumentDetailItem> {
    return apiRequest<DocumentDetailItem>(`/documents/${documentId}/`);
}

export async function deleteDocument(documentId: number): Promise<void> {
    return apiRequest<void>(`/documents/${documentId}/delete/`, {
        method: 'DELETE',
    });
}

type UploadDocumentPayload = {
    file: File;
    sourceLanguage?: string;
    targetLanguage?: string;
};

export async function uploadDocument({file, sourceLanguage = '', targetLanguage = '',}: UploadDocumentPayload): Promise<DocumentDetailItem> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('sourceLanguage', sourceLanguage);
    formData.append('targetLanguage', targetLanguage);

    const response = await fetch(`${API_BASE_URL}/documents/upload/`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Document upload failed with status ${response.status}`);
    }

    return response.json();
}

export type RunPageOcrPayload = {
    documentId: number;
    pageId: number;
    x: number;
    y: number;
    width: number;
    height: number;
    language: string;
};

export type RunPageOcrResponse = {
    text: string;
};

export async function runPageOcr({
                                     documentId,
                                     pageId,
                                     x,
                                     y,
                                     width,
                                     height,
                                     language,
                                 }: RunPageOcrPayload): Promise<RunPageOcrResponse> {
    return apiRequest<RunPageOcrResponse>(
        `/documents/${documentId}/pages/${pageId}/ocr/`,
        {
            method: 'POST',
            body: JSON.stringify({
                x,
                y,
                width,
                height,
                language,
            }),
        },
    );
}