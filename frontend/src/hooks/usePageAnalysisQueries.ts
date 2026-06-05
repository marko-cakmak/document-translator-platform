import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
    getPageAnalyses,
    getPageAnalysis,
} from '../services/documentsApi';
import type {
    PageAnalysesResponse,
    PageAnalysisResult,
} from '../types/documentViewer';
import {
    getPageAnalysesQueryKey,
    getPageAnalysisQueryKey,
} from '../utils/pageAnalysisCache';

type UsePageAnalysisQueriesParams = {
    documentId: number;
    pageId?: number;
    activeAnalysisId: number | null;
    isValidDocumentId: boolean;
};

function usePageAnalysisQueries({
    documentId,
    pageId,
    activeAnalysisId,
    isValidDocumentId,
}: UsePageAnalysisQueriesParams) {
    const pageAnalysesQueryKey = getPageAnalysesQueryKey(
        documentId,
        pageId,
    );

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

    const pageAnalyses = useMemo(
        () => pageAnalysesData?.analyses ?? [],
        [pageAnalysesData?.analyses],
    );

    const activeAnalysisQueryKey = getPageAnalysisQueryKey(
        documentId,
        pageId,
        activeAnalysisId,
    );

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

    return {
        pageAnalyses,
        activeAnalysisResult,
        isFetchingActiveAnalysis,
    };
}

export default usePageAnalysisQueries;
