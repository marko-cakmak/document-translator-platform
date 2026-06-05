import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import usePageAnalysisMutations from './usePageAnalysisMutations';
import usePageAnalysisQueries from './usePageAnalysisQueries';

import type { PageAnalysisResult } from '../types/documentViewer';
import type { UseDocumentPageAnalysisParams } from '../types/documentPageAnalysis';

import { areAllBlocksApproved, getApprovedCount } from '../utils/analysis';
import { getNextSelectedSourceBlockId, getSelectedTranslationBlock, getSourceBlocksForPage, getTranslationBlocksForPage, updateTranslatedTextInAnalysisResult } from '../utils/pageAnalysisState';

function useDocumentPageAnalysis({ documentId, isValidDocumentId, currentPage, targetLanguage, translationMode, setTranslationMode, clearSelection }: UseDocumentPageAnalysisParams) {
    const queryClient = useQueryClient();
    const aiLoadingTimerRef = useRef<number | null>(null);

    const pageId = currentPage?.id;

    const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
    const [analysisResult, setAnalysisResult] = useState<PageAnalysisResult | null>(null);
    const [selectedSourceBlockId, setSelectedSourceBlockId] = useState<string | null>(null);
    const [savingSourceBlockId, setSavingSourceBlockId] = useState<string | null>(null);
    const [approvingTranslationId, setApprovingTranslationId] = useState<number | null>(null);
    const [isAiLoadingVisible, setIsAiLoadingVisible] = useState(false);

    const {pageAnalyses, activeAnalysisResult, isFetchingActiveAnalysis,} = usePageAnalysisQueries({ documentId, pageId, activeAnalysisId, isValidDocumentId,});

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
    }, [
        pageAnalyses,
        pageId,
        activeAnalysisId,
        translationMode,
        setTranslationMode,
    ]);

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

        setSelectedSourceBlockId((currentSelectedId) =>
            getNextSelectedSourceBlockId(
                activeAnalysisResult,
                currentSelectedId,
            ),
        );
    }, [
        activeAnalysisResult,
        pageId,
        setTranslationMode,
    ]);

    const sourceBlocksForCurrentPage = getSourceBlocksForPage(
        analysisResult,
        pageId,
    );

    const translationBlocksForCurrentPage = getTranslationBlocksForPage(
        analysisResult,
        pageId,
    );

    const approvedCount = getApprovedCount(translationBlocksForCurrentPage);
    const totalBlocksCount = translationBlocksForCurrentPage.length;
    const allBlocksApproved = areAllBlocksApproved(
        translationBlocksForCurrentPage,
    );

    const selectedTranslationBlock = getSelectedTranslationBlock(
        translationBlocksForCurrentPage,
        selectedSourceBlockId,
    );

    const {
        isAnalyzing,
        isSavingAnalysis,
        isDeletingAnalysis,
        runAiAnalysis,
        saveCurrentAnalysis,
        deleteCurrentAnalysis,
        saveSelectedBlock,
        approveSelectedBlock,
    } = usePageAnalysisMutations({
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
    });

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

    const changeTranslatedText = (clientId: string, translatedText: string ) => {
        setAnalysisResult((currentResult) =>
            updateTranslatedTextInAnalysisResult(
                currentResult,
                clientId,
                translatedText,
            ),
        );
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
    };
}

export default useDocumentPageAnalysis;
