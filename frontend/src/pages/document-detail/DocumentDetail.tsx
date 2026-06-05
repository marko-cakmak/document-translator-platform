import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import AnalysisLoadingOverlay from '../../components/document-detail/AnalysisLoadingOverlay';
import AnalysisTranslationPanel from '../../components/document-detail/AnalysisTranslationPanel';
import DocumentPagePreview from '../../components/document-detail/DocumentPagePreview';
import DocumentPagination from '../../components/document-detail/DocumentPagination';
import DocumentWorkspaceToolbar from '../../components/document-detail/DocumentWorkspaceToolbar';
import PageAnalysisTabs from '../../components/document-detail/PageAnalysisTabs';

import useDocumentPageAnalysis from '../../hooks/useDocumentPageAnalysis';
import useDocumentTextFormatting from '../../hooks/useDocumentTextFormatting';
import useOcrSelection from '../../hooks/useOcrSelection';

import { documentDetailQuery } from '../../queries/documentsQueries';
import type { TranslationMode } from '../../types/documentViewer';

import {
    getDocumentViewerPages,
    getSafePageIndex,
} from '../../utils/documentPages';

import './DocumentDetail.css';

function DocumentDetail() {
    const { id } = useParams();

    const documentId = Number(id);
    const isValidDocumentId = Number.isFinite(documentId) && documentId > 0;

    const imageRef = useRef<HTMLImageElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [translationMode, setTranslationMode] = useState<TranslationMode>(null);
    const [targetLanguage, setTargetLanguage] = useState('sr');

    const { data: documentData, isLoading, isError, error } = useQuery({ ...documentDetailQuery(documentId), enabled: isValidDocumentId });

    if (isError) {
        console.error('Failed to load document:', error);
    }

    const documentPages = getDocumentViewerPages(documentData);
    const safeCurrentPageIndex = getSafePageIndex(currentPageIndex, documentPages.length);
    const currentPage = documentPages[safeCurrentPageIndex];

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

    const {
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
        isAnalyzing,
        isSavingAnalysis,
        isDeletingAnalysis,
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
    } = useDocumentPageAnalysis({
        documentId,
        isValidDocumentId,
        currentPage,
        targetLanguage,
        translationMode,
        setTranslationMode,
        clearSelection,
    });

    const { formatText } = useDocumentTextFormatting();

    const handleModeChange = (mode: TranslationMode) => {
        setTranslationMode(mode);
        clearSelection();

        if (mode === 'ai') {
            runAiAnalysis();
        }
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
                Unable to load document.
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

            <DocumentWorkspaceToolbar
                translationMode={translationMode}
                targetLanguage={targetLanguage}
                hasSelectionBox={Boolean(selectionBox)}
                isOcrRunning={isOcrRunning}
                isAnalyzing={isAnalyzing}
                isAiLoadingVisible={isAiLoadingVisible}
                onModeChange={handleModeChange}
                onTargetLanguageChange={setTargetLanguage}
                onRunOcr={runOcr}
                onRunAiAnalysis={runAiAnalysis}
                onFormatText={formatText}
            />

            <PageAnalysisTabs
                pageAnalyses={pageAnalyses}
                activeAnalysisId={activeAnalysisId}
                analysisResult={analysisResult}
                isAiLoadingVisible={isAiLoadingVisible}
                approvedCount={approvedCount}
                totalBlocksCount={totalBlocksCount}
                allBlocksApproved={allBlocksApproved}
                isSavingAnalysis={isSavingAnalysis}
                isDeletingAnalysis={isDeletingAnalysis}
                onSelectAnalysis={selectAnalysis}
                onSaveAnalysis={saveCurrentAnalysis}
                onDeleteAnalysis={deleteCurrentAnalysis}
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
                    <AnalysisLoadingOverlay
                        isAiLoadingVisible={isAiLoadingVisible}
                        isFetchingActiveAnalysis={isFetchingActiveAnalysis}
                    />

                    {translationMode === 'ai' ? (
                        <AnalysisTranslationPanel
                            page={currentPage}
                            translationBlocks={translationBlocksForCurrentPage}
                            selectedSourceBlockId={selectedSourceBlockId}
                            savingSourceBlockId={savingSourceBlockId}
                            approvingTranslationId={approvingTranslationId}
                            onSelectSourceBlock={setSelectedSourceBlockId}
                            onChangeTranslatedText={changeTranslatedText}
                            onSaveSelectedBlock={saveSelectedBlock}
                            onApproveSelectedBlock={approveSelectedBlock}
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
