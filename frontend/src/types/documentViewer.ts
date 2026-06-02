export type TranslationMode = 'manual' | 'ai' | null;

export type SelectionBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type DocumentPage = {
    id: number;
    pageNumber: number;
    image: string;
};