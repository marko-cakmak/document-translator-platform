import type {
    AnalysisSourceBlock,
    AnalysisTranslationBlock,
    DocumentPage,
    TranslationMode,
} from './documentViewer';

export type UseDocumentPageAnalysisParams = {
    documentId: number;
    isValidDocumentId: boolean;
    currentPage?: DocumentPage;
    targetLanguage: string;
    translationMode: TranslationMode;
    setTranslationMode: (mode: TranslationMode) => void;
    clearSelection: () => void;
};

export type SaveAnalysisBlockPayload = {
    documentId: number;
    pageId: number;
    analysisId: number;
    sourceBlock: AnalysisSourceBlock;
    translationBlock: AnalysisTranslationBlock;
};
