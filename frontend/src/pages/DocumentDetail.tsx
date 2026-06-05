import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import AnalysisTranslationPanel from '../components/document-detail/AnalysisTranslationPanel';
import DocumentEditorToolbar from '../components/document-detail/DocumentEditorToolbar';
import DocumentModeSelector from '../components/document-detail/DocumentModeSelector';
import DocumentPagePreview from '../components/document-detail/DocumentPagePreview';
import DocumentPagination from '../components/document-detail/DocumentPagination';
import PageAnalysisTabs from '../components/document-detail/PageAnalysisTabs';
import TargetLanguageSelect from '../components/document-detail/TargetLanguageSelect';

import useOcrSelection from '../hooks/useOcrSelection';
import { documentDetailQuery } from '../queries/documentsQueries';
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

import './DocumentDetail.css';

const AI_LOADING_MIN_DURATION_MS = 700;

function DocumentDetail() {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const documentId = Number(id);
    const isValidDocumentId = Number.isFinite(documentId) && documentId > 0;

    const imageRef = useRef<HTMLImageElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const aiLoadingTimerRef = useRef<number | null>(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [translationMode, setTranslationMode] =
        useState<TranslationMode>(null);
    const [targetLanguage, setTargetLanguage] = useState('sr');

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

    const {
        data: documentData,
        isLoading,
        isError,
        error,
    } = useQuery({
        ...documentDetailQuery(documentId),
        enabled: isValidDocumentId,
    });

    if (isError) {
        console.error('Failed to load document:', error);
    }

    const documentPages: DocumentPage[] =
        documentData?.pages
            .filter((page) => Boolean(page.imageUrl))
            .map((page) => ({
                id: page.id,
                pageNumber: page.pageNumber,
                image: page.imageUrl as string,
                width: page.width,
                height: page.height,
            })) ?? [];

    const safeCurrentPageIndex = Math.min(
        currentPageIndex,
        Math.max(documentPages.length - 1, 0),
    );

    const currentPage = documentPages[safeCurrentPageIndex];

    const pageAnalysesQueryKey = [
        'page-analyses',
        documentId,
        currentPage?.id,
    ];

    const {
        data: pageAnalysesData,
    } = useQuery<PageAnalysesResponse>({
        queryKey: pageAnalysesQueryKey,
        queryFn: () =>
            getPageAnalyses({
                documentId,
                pageId: currentPage?.id as number,
            }),
        enabled: isValidDocumentId && Boolean(currentPage?.id),
    });

    const pageAnalyses = pageAnalysesData?.analyses ?? [];

    const activeAnalysisQueryKey = [
        'page-analysis',
        documentId,
        currentPage?.id,
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
                pageId: currentPage?.id as number,
                analysisId: activeAnalysisId as number,
            }),
        enabled:
            isValidDocumentId &&
            Boolean(currentPage?.id) &&
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
        if (!currentPage) {
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
    }, [pageAnalyses, currentPage?.id, activeAnalysisId, translationMode]);

    useEffect(() => {
        if (!activeAnalysisResult || !currentPage) {
            return;
        }

        if (activeAnalysisResult.pageId !== currentPage.id) {
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
    }, [activeAnalysisResult, currentPage?.id]);

    const sourceBlocksForCurrentPage: AnalysisSourceBlock[] =
        analysisResult && currentPage && analysisResult.pageId === currentPage.id
            ? analysisResult.sourceBlocks
            : [];

    const translationBlocksForCurrentPage: AnalysisTranslationBlock[] =
        analysisResult && currentPage && analysisResult.pageId === currentPage.id
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

    const {
        selectionBox,
        isOcrRunning,
        clearSelection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        runOcr,
    } = useOcrSelection({
        documentId,
        pageId: currentPage?.id,
        sourceLanguage: documentData?.sourceLanguage,
        translationMode,
        imageRef,
        editorRef,
    });

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
                        currentPage?.id,
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
            window.alert('AI analysis nije uspela.');
        },
    });

    const savePageAnalysisMutation = useMutation({
        mutationFn: savePageAnalysis,
        onSuccess: (result) => {
            queryClient.setQueryData(
                [
                    'page-analysis',
                    documentId,
                    currentPage?.id,
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
                'Čuvanje analize nije uspelo. Proveri da li su svi blokovi approved.',
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
                    currentPage?.id,
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
            window.alert('Odobravanje bloka nije uspelo.');
        },
    });

    const deleteAnalysisMutation = useMutation({
        mutationFn: deletePageAnalysis,
        onSuccess: () => {
            queryClient.removeQueries({
                queryKey: [
                    'page-analysis',
                    documentId,
                    currentPage?.id,
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
            window.alert('Brisanje analize nije uspelo.');
        },
    });

    const saveBlockMutation = useMutation({
        mutationFn: saveAnalysisBlock,
        onSuccess: () => {
            setSavingSourceBlockId(null);

            queryClient.invalidateQueries({
                queryKey: activeAnalysisQueryKey,
            });
            queryClient.invalidateQueries({
                queryKey: pageAnalysesQueryKey,
            });
        },
        onError: (saveError) => {
            console.error('Save block failed:', saveError);
            setSavingSourceBlockId(null);
            window.alert('Čuvanje bloka nije uspelo.');
        },
    });

    const applyStyleToSelection = (styles: Partial<CSSStyleDeclaration>) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        Object.assign(span.style, styles);

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const nudgeSelection = (deltaX: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        span.style.position = 'relative';
        span.style.left = `${deltaX}px`;
        span.style.display = 'inline-block';

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const changeSelectedFontSize = (delta: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const parentElement =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer as HTMLElement;

        const currentFontSize = parentElement
            ? window.getComputedStyle(parentElement).fontSize
            : '16px';

        const currentSize =
            parseInt(currentFontSize.replace('px', ''), 10) || 16;

        const nextSize = Math.max(8, currentSize + delta);

        applyStyleToSelection({
            fontSize: `${nextSize}px`,
        });
    };

    const formatText = (command: string, value?: string) => {
        if (
            command === 'bold' ||
            command === 'italic' ||
            command === 'justifyCenter'
        ) {
            window.document.execCommand(command);
            return;
        }

        if (command === 'fontSize' && value) {
            applyStyleToSelection({
                fontSize: value,
            });
            return;
        }

        if (command === 'increaseFontSize') {
            changeSelectedFontSize(2);
            return;
        }

        if (command === 'decreaseFontSize') {
            changeSelectedFontSize(-2);
            return;
        }

        if (command === 'nudgeLeft') {
            nudgeSelection(-10);
            return;
        }

        if (command === 'nudgeRight') {
            nudgeSelection(10);
        }
    };

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

    const handleSaveCurrentAnalysis = () => {
        if (!currentPage || !activeAnalysisId || !analysisResult) {
            return;
        }

        if (!allBlocksApproved) {
            window.alert('Svi blokovi moraju biti approved pre čuvanja analize.');
            return;
        }

        savePageAnalysisMutation.mutate({
            documentId,
            pageId: currentPage.id,
            analysisId: activeAnalysisId,
        });
    };

    const handleDeleteCurrentAnalysis = () => {
        if (!currentPage || !activeAnalysisId || !analysisResult) {
            return;
        }

        const confirmed = window.confirm(
            'Obrisati ovu analizu?',
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

    const handleSelectAnalysis = (analysisId: number) => {
        setActiveAnalysisId(analysisId);
        setTranslationMode('ai');
        clearSelection();
    };

    const handleModeChange = (mode: TranslationMode) => {
        setTranslationMode(mode);
        clearSelection();

        if (mode === 'ai') {
            runAiAnalysis();
        }
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

    const goToPreviousPage = () => {
        setCurrentPageIndex((current) => Math.max(current - 1, 0));
        resetPageAnalysisState();
    };

    const goToNextPage = () => {
        setCurrentPageIndex((current) =>
            Math.min(current + 1, documentPages.length - 1),
        );
        resetPageAnalysisState();
    };

    const handleChangeTranslatedText = (
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

    const handleSaveSelectedBlock = () => {
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
            window.alert('Nije pronađen povezani levi/desni blok.');
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

    const handleApproveSelectedBlock = () => {
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

    if (!isValidDocumentId) {
        return (
            <div className="document-detail-state">
                Invalid document ID.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="document-detail-state">
                Loading document...
            </div>
        );
    }

    if (isError || !documentData) {
        return (
            <div className="document-detail-state document-detail-state-error">
                Nije moguće učitati dokument.
            </div>
        );
    }

    if (!currentPage) {
        return (
            <div>
                <div className="document-detail-mini-header">
                    <h1>{documentData.name}</h1>
                </div>

                <div className="document-detail-state">
                    No pages found for this document.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="document-detail-mini-header">
                <h1>{documentData.name}</h1>
            </div>

            <div className="workspace-toolbar">
                <DocumentModeSelector
                    translationMode={translationMode}
                    onModeChange={handleModeChange}
                />

                <div className="workspace-toolbar-actions">
                    <div className="toolbar-group toolbar-group-left">
                        <TargetLanguageSelect
                            value={targetLanguage}
                            onChange={setTargetLanguage}
                        />

                        <button
                            type="button"
                            className="ocr-button"
                            onClick={runOcr}
                            disabled={!selectionBox || isOcrRunning}
                        >
                            {isOcrRunning ? 'Reading text...' : 'Get text by OCR'}
                        </button>

                        <button
                            type="button"
                            className="ocr-button ai-analysis-button"
                            onClick={runAiAnalysis}
                            disabled={analyzeMutation.isPending || isAiLoadingVisible}
                        >
                            {analyzeMutation.isPending || isAiLoadingVisible
                                ? 'Analyzing...'
                                : 'Run AI analysis'}
                        </button>
                    </div>

                    <div className="toolbar-group toolbar-group-right">
                        <DocumentEditorToolbar onFormatText={formatText} />
                    </div>
                </div>
            </div>

            <PageAnalysisTabs
                pageAnalyses={pageAnalyses}
                activeAnalysisId={activeAnalysisId}
                analysisResult={analysisResult}
                isAiLoadingVisible={isAiLoadingVisible}
                approvedCount={approvedCount}
                totalBlocksCount={totalBlocksCount}
                allBlocksApproved={allBlocksApproved}
                isSavingAnalysis={savePageAnalysisMutation.isPending}
                isDeletingAnalysis={deleteAnalysisMutation.isPending}
                onSelectAnalysis={handleSelectAnalysis}
                onSaveAnalysis={handleSaveCurrentAnalysis}
                onDeleteAnalysis={handleDeleteCurrentAnalysis}
            />

            <div className="document-workspace">
                <DocumentPagePreview
                    page={currentPage}
                    translationMode={translationMode}
                    imageRef={imageRef}
                    selectionBox={selectionBox}
                    sourceBlocks={sourceBlocksForCurrentPage}
                    selectedSourceBlockId={selectedSourceBlockId}
                    onSelectSourceBlock={setSelectedSourceBlockId}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />

                <div className="translation-panel">
                    {(isAiLoadingVisible || isFetchingActiveAnalysis) && (
                        <div className="ai-analysis-loading">
                            <div className="ai-analysis-loading-card">
                                <div className="ai-analysis-spinner" />
                                <strong>
                                    {isAiLoadingVisible
                                        ? 'AI analysis is running'
                                        : 'Loading analysis'}
                                </strong>
                                <span>
                                    {isAiLoadingVisible
                                        ? 'Analiziram dokument, tekst i layout...'
                                        : 'Učitavam izabranu analizu stranice...'}
                                </span>
                            </div>
                        </div>
                    )}

                    {translationMode === 'ai' ? (
                        <AnalysisTranslationPanel
                            page={currentPage}
                            translationBlocks={translationBlocksForCurrentPage}
                            selectedSourceBlockId={selectedSourceBlockId}
                            savingSourceBlockId={savingSourceBlockId}
                            approvingTranslationId={approvingTranslationId}
                            onSelectSourceBlock={setSelectedSourceBlockId}
                            onChangeTranslatedText={handleChangeTranslatedText}
                            onSaveSelectedBlock={handleSaveSelectedBlock}
                            onApproveSelectedBlock={handleApproveSelectedBlock}
                        />
                    ) : (
                        <div
                            ref={editorRef}
                            className="translation-editor"
                            contentEditable
                            suppressContentEditableWarning
                        />
                    )}
                </div>
            </div>

            <DocumentPagination
                currentPageNumber={currentPage.pageNumber}
                totalPages={documentPages.length}
                isFirstPage={safeCurrentPageIndex === 0}
                isLastPage={safeCurrentPageIndex === documentPages.length - 1}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
            />
        </div>
    );
}

export default DocumentDetail;
