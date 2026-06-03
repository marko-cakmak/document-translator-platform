export type DocumentStatus =
    | 'uploaded'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'Uploaded'
    | 'Processing'
    | 'Translated';

export type DocumentItem = {
    id: number;
    name: string;
    type?: string;
    status: DocumentStatus;
    uploadedAt: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    pageCount?: number;
};

export type DocumentPageItem = {
    id: number;
    pageNumber: number;
    imageUrl: string | null;
    width: number;
    height: number;
    created_at: string;
};

export type DocumentDetailItem = DocumentItem & {
    pages: DocumentPageItem[];
    error_message?: string;
};