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
    width: number;
    height: number;
};

export type AnalysisBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type AnalysisSourceBlock = {
    id?: number;
    clientId: string;
    blockType: string;
    sourceText: string;
    sourceBox: AnalysisBox;
    confidence: number | null;
    saved?: boolean;
};

export type AnalysisTranslationBlock = {
    id?: number;
    clientId: string;
    sourceClientId: string;
    targetLanguage: string;
    translatedText: string;
    targetBox: AnalysisBox;
    html: string;
    css: Record<string, string>;
    status?: string;
    saved?: boolean;
};

export type PageAnalysisResult = {
    documentId: number;
    pageId: number;
    pageNumber: number;
    imageWidth: number;
    imageHeight: number;
    sourceBlocks: AnalysisSourceBlock[];
    translationBlocks: AnalysisTranslationBlock[];
};
