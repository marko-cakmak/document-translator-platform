import type {
    AnalysisTranslationBlock,
    DocumentPage,
    PageAnalysisResult,
    PageAnalysisSummary,
    TranslationMode,
} from './documentViewer';

export type AnalysisTranslationPanelProps = {
    page: DocumentPage;
    translationBlocks: AnalysisTranslationBlock[];
    selectedSourceBlockId: string | null;
    savingSourceBlockId: string | null;
    approvingTranslationId: number | null;
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
    onSaveSelectedBlock: () => void;
    onApproveSelectedBlock: () => void;
};

export type EditableTranslationTextProps = {
    block: AnalysisTranslationBlock;
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
};

export type TranslatedTextBlockProps = {
    page: DocumentPage;
    block: AnalysisTranslationBlock;
    blockNumber: number;
    isSelected: boolean;
    isSaving: boolean;
    isApproving: boolean;
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
    onSaveSelectedBlock: () => void;
    onApproveSelectedBlock: () => void;
};

export type DocumentWorkspaceToolbarProps = {
    translationMode: TranslationMode;
    targetLanguage: string;
    hasSelectionBox: boolean;
    isOcrRunning: boolean;
    isAnalyzing: boolean;
    isAiLoadingVisible: boolean;
    onModeChange: (mode: TranslationMode) => void;
    onTargetLanguageChange: (language: string) => void;
    onRunOcr: () => void;
    onRunAiAnalysis: () => void;
    onFormatText: (command: string, value?: string) => void;
};

export type AnalysisLoadingOverlayProps = {
    isAiLoadingVisible: boolean;
    isFetchingActiveAnalysis: boolean;
};

export type PageAnalysisTabsProps = {
    pageAnalyses: PageAnalysisSummary[];
    activeAnalysisId: number | null;
    analysisResult: PageAnalysisResult | null;
    isAiLoadingVisible: boolean;
    approvedCount: number;
    totalBlocksCount: number;
    allBlocksApproved: boolean;
    isSavingAnalysis: boolean;
    isDeletingAnalysis: boolean;
    onSelectAnalysis: (analysisId: number) => void;
    onSaveAnalysis: () => void;
    onDeleteAnalysis: () => void;
};

export type SourceBlockOverlayProps = {
    page: import('./documentViewer').DocumentPage;
    block: import('./documentViewer').AnalysisSourceBlock;
    blockNumber: number;
    isSelected: boolean;
    onSelectSourceBlock: (clientId: string) => void;
};

export type SelectionBoxOverlayProps = {
    selectionBox: import('./documentViewer').SelectionBox | null;
};

export type DocumentImageStageProps = {
    page: import('./documentViewer').DocumentPage;
    imageRef: import('react').Ref<HTMLImageElement>;
    selectionBox: import('./documentViewer').SelectionBox | null;
    sourceBlocks: import('./documentViewer').AnalysisSourceBlock[];
    selectedSourceBlockId: string | null;
    onSelectSourceBlock: (clientId: string) => void;
};

export type DocumentPagePreviewProps = {
    page: import('./documentViewer').DocumentPage;
    translationMode: import('./documentViewer').TranslationMode;
    imageRef: import('react').Ref<HTMLImageElement>;
    selectionBox: import('./documentViewer').SelectionBox | null;
    sourceBlocks: import('./documentViewer').AnalysisSourceBlock[];
    selectedSourceBlockId: string | null;
    onSelectSourceBlock: (clientId: string) => void;
    onMouseDown: import('react').MouseEventHandler<HTMLDivElement>;
    onMouseMove: import('react').MouseEventHandler<HTMLDivElement>;
    onMouseUp: import('react').MouseEventHandler<HTMLDivElement>;
};
