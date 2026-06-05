import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useMutation, type QueryClient } from '@tanstack/react-query';

import {
    analyzeDocumentPage,
    approveTranslationBlock,
    deletePageAnalysis,
    getPageAnalysis,
    saveAnalysisBlock,
    savePageAnalysis,
} from '../services/documentsApi';

import type {
    AnalysisTranslationBlock,
    DocumentPage,
    PageAnalysisResult,
    TranslationMode,
} from '../types/documentViewer';
import type { SaveAnalysisBlockPayload } from '../types/documentPageAnalysis';

import {
    invalidatePageAnalysesCache,
    removePageAnalysisResultCache,
    setPageAnalysisResultCache,
    upsertPageAnalysisSummaryCache,
} from '../utils/pageAnalysisCache';

const AI_LOADING_MIN_DURATION_MS = 700;

type UsePageAnalysisMutationsParams = {
    queryClient: QueryClient;
    documentId: number;
    pageId?: number;
    currentPage?: DocumentPage;
    targetLanguage: string;
    allBlocksApproved: boolean;
    activeAnalysisId: number | null;
    analysisResult: PageAnalysisResult | null;
    selectedSourceBlockId: string | null;
    selectedTranslationBlock: AnalysisTranslationBlock | null;
    aiLoadingTimerRef: MutableRefObject<number | null>;
    setTranslationMode: (mode: TranslationMode) => void;
    clearSelection: () => void;
    setActiveAnalysisId: Dispatch<SetStateAction<number | null>>;
    setAnalysisResult: Dispatch<SetStateAction<PageAnalysisResult | null>>;
    setSelectedSourceBlockId: Dispatch<SetStateAction<string | null>>;
    setSavingSourceBlockId: Dispatch<SetStateAction<string | null>>;
    setApprovingTranslationId: Dispatch<SetStateAction<number | null>>;
    setIsAiLoadingVisible: Dispatch<SetStateAction<boolean>>;
};

function usePageAnalysisMutations({
    queryClient,
    documentId,
    pageId,
    currentPage,
    targetLanguage,
    allBlocksApproved,
    activeAnalysisId,
    analysisResult,
    selectedSourceBlockId,
    selectedTranslationBlock,
    aiLoadingTimerRef,
    setTranslationMode,
    clearSelection,
    setActiveAnalysisId,
    setAnalysisResult,
    setSelectedSourceBlockId,
    setSavingSourceBlockId,
    setApprovingTranslationId,
    setIsAiLoadingVisible,
}: UsePageAnalysisMutationsParams) {
    const analyzeMutation = useMutation({
        mutationFn: analyzeDocumentPage,
        onSuccess: (result) => {
            if (aiLoadingTimerRef.current) {
                window.clearTimeout(aiLoadingTimerRef.current);
            }

            aiLoadingTimerRef.current = window.setTimeout(() => {
                setPageAnalysisResultCache(
                    queryClient,
                    documentId,
                    pageId,
                    result,
                );

                if (currentPage) {
                    upsertPageAnalysisSummaryCache(
                        queryClient,
                        documentId,
                        currentPage,
                        result,
                    );
                }

                setActiveAnalysisId(result.analysisId ?? null);
                setAnalysisResult(result);
                setTranslationMode('ai');
                setSelectedSourceBlockId(
                    result.sourceBlocks[0]?.clientId ?? null,
                );
                setSavingSourceBlockId(null);
                setApprovingTranslationId(null);
                setIsAiLoadingVisible(false);

                invalidatePageAnalysesCache(
                    queryClient,
                    documentId,
                    pageId,
                );
            }, AI_LOADING_MIN_DURATION_MS);
        },
        onError: (analyzeError) => {
            console.error('AI analysis failed:', analyzeError);
            setIsAiLoadingVisible(false);
            window.alert('AI analysis failed.');
        },
    });

    const savePageAnalysisMutation = useMutation({
        mutationFn: savePageAnalysis,
        onSuccess: (result) => {
            setPageAnalysisResultCache(
                queryClient,
                documentId,
                pageId,
                result,
            );

            setActiveAnalysisId(result.analysisId ?? null);
            setAnalysisResult(result);
            setSelectedSourceBlockId(result.sourceBlocks[0]?.clientId ?? null);
            setSavingSourceBlockId(null);
            setApprovingTranslationId(null);

            invalidatePageAnalysesCache(
                queryClient,
                documentId,
                pageId,
            );
        },
        onError: (saveError) => {
            console.error('Save analysis failed:', saveError);
            window.alert(
                'Saving analysis failed. Please make sure all blocks are approved.',
            );
        },
    });

    const approveBlockMutation = useMutation({
        mutationFn: approveTranslationBlock,
        onSuccess: (result) => {
            setPageAnalysisResultCache(
                queryClient,
                documentId,
                pageId,
                result,
            );

            setAnalysisResult(result);
            setActiveAnalysisId(result.analysisId ?? null);
            setApprovingTranslationId(null);

            invalidatePageAnalysesCache(
                queryClient,
                documentId,
                pageId,
            );
        },
        onError: (approveError) => {
            console.error('Approve block failed:', approveError);
            setApprovingTranslationId(null);
            window.alert('Approving block failed.');
        },
    });

    const deleteAnalysisMutation = useMutation({
        mutationFn: deletePageAnalysis,
        onSuccess: () => {
            removePageAnalysisResultCache(
                queryClient,
                documentId,
                pageId,
                activeAnalysisId,
            );

            setActiveAnalysisId(null);
            setAnalysisResult(null);
            setSelectedSourceBlockId(null);
            setSavingSourceBlockId(null);
            setApprovingTranslationId(null);

            invalidatePageAnalysesCache(
                queryClient,
                documentId,
                pageId,
            );
        },
        onError: (deleteError) => {
            console.error('Delete analysis failed:', deleteError);
            window.alert('Deleting analysis failed.');
        },
    });

    const saveBlockMutation = useMutation({
        mutationFn: async (payload: SaveAnalysisBlockPayload) => {
            await saveAnalysisBlock(payload);

            return getPageAnalysis({
                documentId: payload.documentId,
                pageId: payload.pageId,
                analysisId: payload.analysisId,
            });
        },
        onSuccess: (freshAnalysisResult) => {
            setPageAnalysisResultCache(
                queryClient,
                documentId,
                pageId,
                freshAnalysisResult,
            );

            setAnalysisResult(freshAnalysisResult);
            setActiveAnalysisId(freshAnalysisResult.analysisId ?? null);
            setSavingSourceBlockId(null);

            invalidatePageAnalysesCache(
                queryClient,
                documentId,
                pageId,
            );
        },
        onError: (saveError) => {
            console.error('Save block failed:', saveError);
            setSavingSourceBlockId(null);
            window.alert('Saving block failed.');
        },
    });

    const runAiAnalysis = () => {
        if (!currentPage) {
            return;
        }

        if (aiLoadingTimerRef.current) {
            window.clearTimeout(aiLoadingTimerRef.current);
        }

        setTranslationMode('ai');
        setIsAiLoadingVisible(true);

        setAnalysisResult(null);
        setSelectedSourceBlockId(null);
        setSavingSourceBlockId(null);
        setApprovingTranslationId(null);

        clearSelection();

        analyzeMutation.mutate({
            documentId,
            pageId: currentPage.id,
            targetLanguage,
        });
    };

    const saveCurrentAnalysis = () => {
        if (!currentPage || !activeAnalysisId || !analysisResult) {
            return;
        }

        if (!allBlocksApproved) {
            window.alert('All blocks must be approved before saving analysis.');
            return;
        }

        savePageAnalysisMutation.mutate({
            documentId,
            pageId: currentPage.id,
            analysisId: activeAnalysisId,
        });
    };

    const deleteCurrentAnalysis = () => {
        if (!currentPage || !activeAnalysisId || !analysisResult) {
            return;
        }

        const confirmed = window.confirm(
            'Delete this analysis?',
        );

        if (!confirmed) {
            return;
        }

        deleteAnalysisMutation.mutate({
            documentId,
            pageId: currentPage.id,
            analysisId: activeAnalysisId,
        });
    };

    const saveSelectedBlock = () => {
        if (
            !analysisResult ||
            !currentPage ||
            !selectedSourceBlockId ||
            !activeAnalysisId
        ) {
            return;
        }

        const sourceBlock = analysisResult.sourceBlocks.find(
            (block) => block.clientId === selectedSourceBlockId,
        );

        const translationBlock = analysisResult.translationBlocks.find(
            (block) => block.sourceClientId === selectedSourceBlockId,
        );

        if (!sourceBlock || !translationBlock) {
            window.alert('Could not find the linked source and translation blocks.');
            return;
        }

        setSavingSourceBlockId(selectedSourceBlockId);

        saveBlockMutation.mutate({
            documentId,
            pageId: currentPage.id,
            analysisId: activeAnalysisId,
            sourceBlock: {
                ...sourceBlock,
                analysisId: activeAnalysisId,
            },
            translationBlock: {
                ...translationBlock,
                analysisId: activeAnalysisId,
                status: 'draft',
            },
        });
    };

    const approveSelectedBlock = () => {
        if (
            !currentPage ||
            !activeAnalysisId ||
            !selectedTranslationBlock ||
            !selectedTranslationBlock.id
        ) {
            return;
        }

        setApprovingTranslationId(selectedTranslationBlock.id);

        approveBlockMutation.mutate({
            documentId,
            pageId: currentPage.id,
            analysisId: activeAnalysisId,
            translationId: selectedTranslationBlock.id,
        });
    };

    return {
        isAnalyzing: analyzeMutation.isPending,
        isSavingAnalysis: savePageAnalysisMutation.isPending,
        isDeletingAnalysis: deleteAnalysisMutation.isPending,
        runAiAnalysis,
        saveCurrentAnalysis,
        deleteCurrentAnalysis,
        saveSelectedBlock,
        approveSelectedBlock,
    };
}

export default usePageAnalysisMutations;
