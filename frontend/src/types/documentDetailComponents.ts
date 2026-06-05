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
