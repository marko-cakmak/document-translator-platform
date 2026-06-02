export type DocumentStatus = 'Uploaded' | 'Processing' | 'Translated';

export type DocumentItem = {
    id: number;
    name: string;
    type: string;
    status: DocumentStatus;
    uploadedAt: string;
};