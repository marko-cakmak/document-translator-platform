import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import AnalysisTranslationPanel from '../components/document-detail/AnalysisTranslationPanel';
import DocumentEditorToolbar from '../components/document-detail/DocumentEditorToolbar';
import DocumentModeSelector from '../components/document-detail/DocumentModeSelector';
import DocumentPagePreview from '../components/document-detail/DocumentPagePreview';
import DocumentPagination from '../components/document-detail/DocumentPagination';
import TargetLanguageSelect from '../components/document-detail/TargetLanguageSelect';

import useOcrSelection from '../hooks/useOcrSelection';
import { documentDetailQuery } from '../queries/documentsQueries';
import {
    analyzeDocumentPage,
    getSavedPageBlocks,
    saveAnalysisBlock,
} from '../services/documentsApi';
import type {
    AnalysisSourceBlock,
    AnalysisTranslationBlock,
    DocumentPage,
    PageAnalysisResult,
    TranslationMode,
} from '../types/documentViewer';

import './DocumentDetail.css';

type AnalysisSource = 'saved' | 'ai' | null;

type AnalysisTab = {
    id: string;
    label: string;
    source: AnalysisSource;
    result: PageAnalysisResult;
    savedSourceBlockIds: string[];
};

const AI_LOADING_MIN_DURATION_MS = 700;

function DocumentDetail() {
    const { id } = useParams();

    const documentId = Number(id);
    const isValidDocumentId = Number.isFinite(documentId) && documentId > 0;

    const imageRef = useRef<HTMLImageElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const aiLoadingTimerRef = useRef<number | null>(null);
    const aiRunCounterRef = useRef(1);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [translationMode, setTranslationMode] =
        useState<TranslationMode>(null);
    const [targetLanguage, setTargetLanguage] = useState('sr');

    const [analysisResult, setAnalysisResult] =
        useState<PageAnalysisResult | null>(null);
    const [analysisSource, setAnalysisSource] =
        useState<AnalysisSource>(null);
    const [analysisTabs, setAnalysisTabs] = useState<AnalysisTab[]>([]);
    const [activeAnalysisTabId, setActiveAnalysisTabId] =
        useState<string | null>(null);

    const [selectedSourceBlockId, setSelectedSourceBlockId] =
        useState<string | null>(null);
    const [savingSourceBlockId, setSavingSourceBlockId] =
        useState<string | null>(null);
    const [savedSourceBlockIds, setSavedSourceBlockIds] =
        useState<string[]>([]);
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

    const {
        data: savedBlocksResult,
        refetch: refetchSavedBlocks,
    } = useQuery({
        queryKey: ['saved-page-blocks', documentId, currentPage?.id],
        queryFn: () =>
            getSavedPageBlocks({
                documentId,
                pageId: currentPage?.id as number,
            }),
        enabled: isValidDocumentId && Boolean(currentPage?.id),
    });

    useEffect(() => {
        return () => {
            if (aiLoadingTimerRef.current) {
                window.clearTimeout(aiLoadingTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!savedBlocksResult || !currentPage?.id) {
            return;
        }

        if (savedBlocksResult.pageId !== currentPage.id) {
            return;
        }

        if (savedBlocksResult.sourceBlocks.length === 0) {
            return;
        }

        const savedTab: AnalysisTab = {
            id: 'saved',
            label: 'Actual state',
            source: 'saved',
            result: savedBlocksResult,
            savedSourceBlockIds: savedBlocksResult.sourceBlocks.map(
                (block) => block.clientId,
            ),
        };

        setAnalysisTabs((currentTabs) => {
            const nonSavedTabs = currentTabs.filter((tab) => tab.id !== 'saved');

            return [savedTab, ...nonSavedTabs];
        });

        if (activeAnalysisTabId?.startsWith('ai')) {
            return;
        }

        setAnalysisResult(savedBlocksResult);
        setAnalysisSource('saved');
        setActiveAnalysisTabId('saved');
        setTranslationMode('ai');
        setSelectedSourceBlockId(
            savedBlocksResult.sourceBlocks[0]?.clientId ?? null,
        );
        setSavedSourceBlockIds(savedTab.savedSourceBlockIds);
        setSavingSourceBlockId(null);
    }, [savedBlocksResult, currentPage?.id]);

    const sourceBlocksForCurrentPage: AnalysisSourceBlock[] =
        analysisResult && currentPage && analysisResult.pageId === currentPage.id
            ? analysisResult.sourceBlocks
            : [];

    const translationBlocksForCurrentPage: AnalysisTranslationBlock[] =
        analysisResult && currentPage && analysisResult.pageId === currentPage.id
            ? analysisResult.translationBlocks
            : [];

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

    const activateAnalysisTab = (tab: AnalysisTab) => {
        if (aiLoadingTimerRef.current) {
            window.clearTimeout(aiLoadingTimerRef.current);
        }

        setIsAiLoadingVisible(false);
        setActiveAnalysisTabId(tab.id);
        setAnalysisResult(tab.result);
        setAnalysisSource(tab.source);
        setTranslationMode('ai');
        setSelectedSourceBlockId(
            tab.result.sourceBlocks[0]?.clientId ?? null,
        );
        setSavedSourceBlockIds(tab.savedSourceBlockIds);
        setSavingSourceBlockId(null);
        clearSelection();
    };

    const analyzeMutation = useMutation({
        mutationFn: analyzeDocumentPage,
        onSuccess: (result) => {
            if (aiLoadingTimerRef.current) {
                window.clearTimeout(aiLoadingTimerRef.current);
            }

            aiLoadingTimerRef.current = window.setTimeout(() => {
                const nextRunNumber = aiRunCounterRef.current;
                aiRunCounterRef.current += 1;

                const newTab: AnalysisTab = {
                    id: `ai-${Date.now()}`,
                    label: `AI run ${nextRunNumber}`,
                    source: 'ai',
                    result,
                    savedSourceBlockIds: [],
                };

                setAnalysisTabs((currentTabs) => [...currentTabs, newTab]);

                setAnalysisResult(result);
                setAnalysisSource('ai');
                setActiveAnalysisTabId(newTab.id);
                setSelectedSourceBlockId(
                    result.sourceBlocks[0]?.clientId ?? null,
                );
                setSavedSourceBlockIds([]);
                setSavingSourceBlockId(null);
                setIsAiLoadingVisible(false);
            }, AI_LOADING_MIN_DURATION_MS);
        },
        onError: (analyzeError) => {
            console.error('AI analysis failed:', analyzeError);
            setIsAiLoadingVisible(false);
            window.alert('AI analysis nije uspela.');
        },
    });

    const saveBlockMutation = useMutation({
        mutationFn: saveAnalysisBlock,
        onSuccess: (result) => {
            setSavedSourceBlockIds((currentIds) => {
                if (currentIds.includes(result.sourceClientId)) {
                    return currentIds;
                }

                return [...currentIds, result.sourceClientId];
            });

            setAnalysisTabs((currentTabs) =>
                currentTabs.map((tab) => {
                    if (tab.id !== activeAnalysisTabId) {
                        return tab;
                    }

                    if (tab.savedSourceBlockIds.includes(result.sourceClientId)) {
                        return tab;
                    }

                    return {
                        ...tab,
                        savedSourceBlockIds: [
                            ...tab.savedSourceBlockIds,
                            result.sourceClientId,
                        ],
                    };
                }),
            );

            setSavingSourceBlockId(null);
            refetchSavedBlocks();
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
        setAnalysisSource('ai');
        setIsAiLoadingVisible(true);

        setAnalysisResult(null);
        setSelectedSourceBlockId(null);
        setSavedSourceBlockIds([]);
        setSavingSourceBlockId(null);

        clearSelection();

        analyzeMutation.mutate({
            documentId,
            pageId: currentPage.id,
            targetLanguage,
        });
    };

    const discardAiResult = () => {
        if (aiLoadingTimerRef.current) {
            window.clearTimeout(aiLoadingTimerRef.current);
        }

        if (activeAnalysisTabId?.startsWith('ai')) {
            const savedTab = analysisTabs.find((tab) => tab.id === 'saved');
            const tabToRemove = activeAnalysisTabId;

            setAnalysisTabs((currentTabs) =>
                currentTabs.filter((tab) => tab.id !== tabToRemove),
            );

            if (savedTab) {
                activateAnalysisTab(savedTab);
                return;
            }
        }

        setIsAiLoadingVisible(false);
        setAnalysisResult(null);
        setAnalysisSource(null);
        setActiveAnalysisTabId(null);
        setSelectedSourceBlockId(null);
        setSavedSourceBlockIds([]);
        setSavingSourceBlockId(null);
        clearSelection();

        refetchSavedBlocks();
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
        setAnalysisSource(null);
        setAnalysisTabs([]);
        setActiveAnalysisTabId(null);
        setSelectedSourceBlockId(null);
        setSavedSourceBlockIds([]);
        setSavingSourceBlockId(null);
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
                translationBlocks: currentResult.translationBlocks.map((block) =>
                    block.clientId === clientId
                        ? {
                            ...block,
                            translatedText,
                            html: `<p>${translatedText}</p>`,
                        }
                        : block,
                ),
            };
        };

        setAnalysisResult(updateResult);

        setAnalysisTabs((currentTabs) =>
            currentTabs.map((tab) => {
                if (tab.id !== activeAnalysisTabId) {
                    return tab;
                }

                return {
                    ...tab,
                    result: updateResult(tab.result) as PageAnalysisResult,
                };
            }),
        );
    };

    const handleSaveSelectedBlock = () => {
        if (!analysisResult || !currentPage || !selectedSourceBlockId) {
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
            sourceBlock,
            translationBlock,
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

            {(analysisTabs.length > 0 || isAiLoadingVisible) && (
                <div className="analysis-version-tabs">
                    <div className="analysis-version-tabs-main">
                        <div className="analysis-version-tabs-label">
                            Page versions
                        </div>

                        <div className="analysis-version-tabs-list">
                            {analysisTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={
                                        activeAnalysisTabId === tab.id
                                            ? 'analysis-version-tab active'
                                            : 'analysis-version-tab'
                                    }
                                    onClick={() => activateAnalysisTab(tab)}
                                >
                                    <span
                                        className={
                                            tab.source === 'saved'
                                                ? 'analysis-version-dot saved'
                                                : 'analysis-version-dot ai'
                                        }
                                    />

                                    <strong>{tab.label}</strong>

                                    <small>
                                        {tab.result.sourceBlocks.length} blocks
                                    </small>
                                </button>
                            ))}

                            {isAiLoadingVisible && (
                                <button
                                    type="button"
                                    className="analysis-version-tab active loading"
                                    disabled
                                >
                                    <span className="analysis-version-dot ai" />
                                    <strong>Generating...</strong>
                                    <small>AI draft</small>
                                </button>
                            )}
                        </div>
                    </div>

                    {analysisSource === 'ai' && !isAiLoadingVisible && (
                        <div className="analysis-version-actions">
                            <span>AI draft is not saved automatically.</span>

                            <button
                                type="button"
                                onClick={discardAiResult}
                            >
                                Discard AI result
                            </button>
                        </div>
                    )}
                </div>
            )}

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
                    {isAiLoadingVisible && (
                        <div className="ai-analysis-loading">
                            <div className="ai-analysis-loading-card">
                                <div className="ai-analysis-spinner" />
                                <strong>AI analysis is running</strong>
                                <span>Analiziram dokument, tekst i layout...</span>
                            </div>
                        </div>
                    )}

                    {translationMode === 'ai' ? (
                        <AnalysisTranslationPanel
                            page={currentPage}
                            translationBlocks={translationBlocksForCurrentPage}
                            selectedSourceBlockId={selectedSourceBlockId}
                            savingSourceBlockId={savingSourceBlockId}
                            savedSourceBlockIds={savedSourceBlockIds}
                            onSelectSourceBlock={setSelectedSourceBlockId}
                            onChangeTranslatedText={handleChangeTranslatedText}
                            onSaveSelectedBlock={handleSaveSelectedBlock}
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