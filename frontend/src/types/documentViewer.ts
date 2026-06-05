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

export type PageAnalysisStatus =
    | 'draft'
    | 'saved'
    | 'archived'
    | 'discarded'
    | 'accepted';

export type PageAnalysisSource = 'ai' | 'manual' | 'initial';

export type PageAnalysisSummary = {
    id: number;
    name: string;
    source: PageAnalysisSource;
    status: PageAnalysisStatus;
    createdAt: string;
    updatedAt: string;
    blocksCount: number;
};

export type PageAnalysesResponse = {
    documentId: number;
    pageId: number;
    pageNumber: number;
    analyses: PageAnalysisSummary[];
};

export type AnalysisSourceBlock = {
    id?: number;
    analysisId?: number;
    clientId: string;
    blockType: string;
    sourceText: string;
    sourceBox: AnalysisBox;
    confidence: number | null;
    saved?: boolean;
};

export type AnalysisTranslationBlock = {
    id?: number;
    analysisId?: number;
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
    analysisId?: number;
    analysisName?: string;
    analysisSource?: PageAnalysisSource;
    analysisStatus?: PageAnalysisStatus;
    imageWidth: number;
    imageHeight: number;
    sourceBlocks: AnalysisSourceBlock[];
    translationBlocks: AnalysisTranslationBlock[];
};
