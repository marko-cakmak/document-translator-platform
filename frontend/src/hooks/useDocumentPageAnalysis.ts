import {
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import {
    analyzeDocumentPage,
    approveTranslationBlock,
    deletePageAnalysis,
    getPageAnalyses,
    getPageAnalysis,
    saveAnalysisBlock,
    savePageAnalysis,
} from '../services/documentsApi';
import type {
    AnalysisSourceBlock,
    AnalysisTranslationBlock,
    DocumentPage,
    PageAnalysesResponse,
    PageAnalysisResult,
    PageAnalysisSummary,
    TranslationMode,
} from '../types/documentViewer';
import {
    areAllBlocksApproved,
    getApprovedCount,
} from '../utils/analysis';

const AI_LOADING_MIN_DURATION_MS = 700;

type UseDocumentPageAnalysisParams = {
    documentId: number;
    isValidDocumentId: boolean;
    currentPage?: DocumentPage;
    targetLanguage: string;
    translationMode: TranslationMode;
    setTranslationMode: (mode: TranslationMode) => void;
    clearSelection: () => void;
};

type SaveAnalysisBlockPayload = Parameters<typeof saveAnalysisBlock>[0];

function useDocumentPageAnalysis({
    documentId,
    isValidDocumentId,
    currentPage,
    targetLanguage,
    translationMode,
    setTranslationMode,
    clearSelection,
}: UseDocumentPageAnalysisParams) {
    const queryClient = useQueryClient();
    const aiLoadingTimerRef = useRef<number | null>(null);

    const pageId = currentPage?.id;

    const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
    const [analysisResult, setAnalysisResult] =
        useState<PageAnalysisResult | null>(null);
    const [selectedSourceBlockId, setSelectedSourceBlockId] =
        useState<string | null>(null);
    const [savingSourceBlockId, setSavingSourceBlockId] =
        useState<string | null>(null);
    const [approvingTranslationId, setApprovingTranslationId] =
        useState<number | null>(null);
    const [isAiLoadingVisible, setIsAiLoadingVisible] = useState(false);

    const pageAnalysesQueryKey = [
        'page-analyses',
        documentId,
        pageId,
    ];

    const {
        data: pageAnalysesData,
    } = useQuery<PageAnalysesResponse>({
        queryKey: pageAnalysesQueryKey,
        queryFn: () =>
            getPageAnalyses({
                documentId,
                pageId: pageId as number,
            }),
        enabled: isValidDocumentId && Boolean(pageId),
    });

    const pageAnalyses = pageAnalysesData?.analyses ?? [];

    const activeAnalysisQueryKey = [
        'page-analysis',
        documentId,
        pageId,
        activeAnalysisId,
    ];

    const {
        data: activeAnalysisResult,
        isFetching: isFetchingActiveAnalysis,
    } = useQuery<PageAnalysisResult>({
        queryKey: activeAnalysisQueryKey,
        queryFn: () =>
            getPageAnalysis({
                documentId,
                pageId: pageId as number,
                analysisId: activeAnalysisId as number,
            }),
        enabled:
            isValidDocumentId &&
            Boolean(pageId) &&
            Boolean(activeAnalysisId),
    });

    useEffect(() => {
        return () => {
            if (aiLoadingTimerRef.current) {
                window.clearTimeout(aiLoadingTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!pageId) {
            return;
        }

        if (pageAnalyses.length === 0) {
            setActiveAnalysisId(null);
            setAnalysisResult(null);
            setSelectedSourceBlockId(null);
            setSavingSourceBlockId(null);
            setApprovingTranslationId(null);

            if (translationMode === 'ai') {
                setTranslationMode(null);
            }

            return;
        }

        if (
            activeAnalysisId &&
            pageAnalyses.some((analysis) => analysis.id === activeAnalysisId)
        ) {
            return;
        }

        const latestAnalysis = pageAnalyses[pageAnalyses.length - 1];

        setActiveAnalysisId(latestAnalysis.id);
        setTranslationMode('ai');
    }, [pageAnalyses, pageId, activeAnalysisId, translationMode, setTranslationMode]);

    useEffect(() => {
        if (!activeAnalysisResult || !pageId) {
            return;
        }

        if (activeAnalysisResult.pageId !== pageId) {
            return;
        }

        setAnalysisResult(activeAnalysisResult);
        setTranslationMode('ai');
        setSavingSourceBlockId(null);
        setApprovingTranslationId(null);

        const blockIds = activeAnalysisResult.sourceBlocks.map(
            (block) => block.clientId,
        );

        setSelectedSourceBlockId((currentSelectedId) => {
            if (
                currentSelectedId &&
                blockIds.includes(currentSelectedId)
            ) {
                return currentSelectedId;
            }

            return activeAnalysisResult.sourceBlocks[0]?.clientId ?? null;
        });
    }, [activeAnalysisResult, pageId, setTranslationMode]);

    const sourceBlocksForCurrentPage: AnalysisSourceBlock[] =
        analysisResult && pageId && analysisResult.pageId === pageId
            ? analysisResult.sourceBlocks
            : [];

    const translationBlocksForCurrentPage: AnalysisTranslationBlock[] =
        analysisResult && pageId && analysisResult.pageId === pageId
            ? analysisResult.translationBlocks
            : [];

    const approvedCount = getApprovedCount(translationBlocksForCurrentPage);
    const totalBlocksCount = translationBlocksForCurrentPage.length;
    const allBlocksApproved = areAllBlocksApproved(
        translationBlocksForCurrentPage,
    );

    const selectedTranslationBlock = selectedSourceBlockId
        ? translationBlocksForCurrentPage.find(
            (block) => block.sourceClientId === selectedSourceBlockId,
        )
        : null;

    const analyzeMutation = useMutation({
        mutationFn: analyzeDocumentPage,
        onSuccess: (result) => {
            if (aiLoadingTimerRef.current) {
                window.clearTimeout(aiLoadingTimerRef.current);
            }

            aiLoadingTimerRef.current = window.setTimeout(() => {
                queryClient.setQueryData(
                    [
                        'page-analysis',
                        documentId,
                        pageId,
                        result.analysisId,
                    ],
                    result,
                );

                if (result.analysisId && currentPage) {
                    queryClient.setQueryData<PageAnalysesResponse>(
                        pageAnalysesQueryKey,
                        (currentData) => {
                            const existingAnalyses = currentData?.analyses ?? [];

                            const alreadyExists = existingAnalyses.some(
                                (analysis) => analysis.id === result.analysisId,
                            );

                            const nextAnalysis: PageAnalysisSummary = {
                                id: result.analysisId as number,
                                name: result.analysisName ?? 'AI analysis',
                                source: result.analysisSource ?? 'ai',
                                status: result.analysisStatus ?? 'draft',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                blocksCount: result.sourceBlocks.length,
                            };

                            return {
                                documentId,
                                pageId: currentPage.id,
                                pageNumber: currentPage.pageNumber,
                                analyses: alreadyExists
                                    ? existingAnalyses.map((analysis) =>
                                        analysis.id === result.analysisId
                                            ? {
                                                ...analysis,
                                                ...nextAnalysis,
                                            }
                                            : analysis,
                                    )
                                    : [...existingAnalyses, nextAnalysis],
                            };
                        },
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

                queryClient.invalidateQueries({
                    queryKey: pageAnalysesQueryKey,
                });
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
            queryClient.setQueryData(
                [
                    'page-analysis',
                    documentId,
                    pageId,
                    result.analysisId,
                ],
                result,
            );

            setActiveAnalysisId(result.analysisId ?? null);
            setAnalysisResult(result);
            setSelectedSourceBlockId(result.sourceBlocks[0]?.clientId ?? null);
            setSavingSourceBlockId(null);
            setApprovingTranslationId(null);

            queryClient.invalidateQueries({
                queryKey: pageAnalysesQueryKey,
            });
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
            queryClient.setQueryData(
                [
                    'page-analysis',
                    documentId,
                    pageId,
                    result.analysisId,
                ],
                result,
            );

            setAnalysisResult(result);
            setActiveAnalysisId(result.analysisId ?? null);
            setApprovingTranslationId(null);

            queryClient.invalidateQueries({
                queryKey: pageAnalysesQueryKey,
            });
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
            queryClient.removeQueries({
                queryKey: [
                    'page-analysis',
                    documentId,
                    pageId,
                    activeAnalysisId,
                ],
            });

            setActiveAnalysisId(null);
            setAnalysisResult(null);
            setSelectedSourceBlockId(null);
            setSavingSourceBlockId(null);
            setApprovingTranslationId(null);

            queryClient.invalidateQueries({
                queryKey: pageAnalysesQueryKey,
            });
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
            queryClient.setQueryData(
                [
                    'page-analysis',
                    documentId,
                    pageId,
                    freshAnalysisResult.analysisId,
                ],
                freshAnalysisResult,
            );

            setAnalysisResult(freshAnalysisResult);
            setActiveAnalysisId(freshAnalysisResult.analysisId ?? null);
            setSavingSourceBlockId(null);

            queryClient.invalidateQueries({
                queryKey: pageAnalysesQueryKey,
            });
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

    const selectAnalysis = (analysisId: number) => {
        setActiveAnalysisId(analysisId);
        setTranslationMode('ai');
        clearSelection();
    };

    const resetPageAnalysisState = () => {
        if (aiLoadingTimerRef.current) {
            window.clearTimeout(aiLoadingTimerRef.current);
        }

        setIsAiLoadingVisible(false);
        setAnalysisResult(null);
        setActiveAnalysisId(null);
        setSelectedSourceBlockId(null);
        setSavingSourceBlockId(null);
        setApprovingTranslationId(null);
        clearSelection();
    };

    const changeTranslatedText = (
        clientId: string,
        translatedText: string,
    ) => {
        const updateResult = (currentResult: PageAnalysisResult | null) => {
            if (!currentResult) {
                return currentResult;
            }

            return {
                ...currentResult,
                analysisStatus:
                    currentResult.analysisStatus === 'saved'
                        ? 'draft'
                        : currentResult.analysisStatus,
                translationBlocks: currentResult.translationBlocks.map((block) =>
                    block.clientId === clientId
                        ? {
                            ...block,
                            status: 'draft',
                            translatedText,
                            html: `<p>${translatedText}</p>`,
                        }
                        : block,
                ),
            };
        };

        setAnalysisResult(updateResult);
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
        activeAnalysisId,
        analysisResult,
        pageAnalyses,
        sourceBlocksForCurrentPage,
        translationBlocksForCurrentPage,
        selectedSourceBlockId,
        savingSourceBlockId,
        approvingTranslationId,
        isAiLoadingVisible,
        isFetchingActiveAnalysis,
        isAnalyzing: analyzeMutation.isPending,
        isSavingAnalysis: savePageAnalysisMutation.isPending,
        isDeletingAnalysis: deleteAnalysisMutation.isPending,
        approvedCount,
        totalBlocksCount,
        allBlocksApproved,
        setSelectedSourceBlockId,
        runAiAnalysis,
        saveCurrentAnalysis,
        deleteCurrentAnalysis,
        selectAnalysis,
        resetPageAnalysisState,
        changeTranslatedText,
        saveSelectedBlock,
        approveSelectedBlock,
    };
}

export default useDocumentPageAnalysis;
