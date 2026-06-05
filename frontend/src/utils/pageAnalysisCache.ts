import type { QueryClient } from '@tanstack/react-query';

import type {
    DocumentPage,
    PageAnalysesResponse,
    PageAnalysisResult,
    PageAnalysisSummary,
} from '../types/documentViewer';

export function getPageAnalysesQueryKey(
    documentId: number,
    pageId?: number,
) {
    return [
        'page-analyses',
        documentId,
        pageId,
    ] as const;
}

export function getPageAnalysisQueryKey(
    documentId: number,
    pageId?: number,
    analysisId?: number | null,
) {
    return [
        'page-analysis',
        documentId,
        pageId,
        analysisId,
    ] as const;
}

export function createPageAnalysisSummary(
    result: PageAnalysisResult,
): PageAnalysisSummary {
    return {
        id: result.analysisId as number,
        name: result.analysisName ?? 'AI analysis',
        source: result.analysisSource ?? 'ai',
        status: result.analysisStatus ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocksCount: result.sourceBlocks.length,
    };
}

export function setPageAnalysisResultCache(
    queryClient: QueryClient,
    documentId: number,
    pageId: number | undefined,
    result: PageAnalysisResult,
) {
    queryClient.setQueryData(
        getPageAnalysisQueryKey(
            documentId,
            pageId,
            result.analysisId,
        ),
        result,
    );
}

export function upsertPageAnalysisSummaryCache(
    queryClient: QueryClient,
    documentId: number,
    page: DocumentPage,
    result: PageAnalysisResult,
) {
    if (!result.analysisId) {
        return;
    }

    queryClient.setQueryData<PageAnalysesResponse>(
        getPageAnalysesQueryKey(documentId, page.id),
        (currentData) => {
            const existingAnalyses = currentData?.analyses ?? [];
            const nextAnalysis = createPageAnalysisSummary(result);

            const alreadyExists = existingAnalyses.some(
                (analysis) => analysis.id === result.analysisId,
            );

            return {
                documentId,
                pageId: page.id,
                pageNumber: page.pageNumber,
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

export function removePageAnalysisResultCache(
    queryClient: QueryClient,
    documentId: number,
    pageId: number | undefined,
    analysisId: number | null,
) {
    queryClient.removeQueries({
        queryKey: getPageAnalysisQueryKey(
            documentId,
            pageId,
            analysisId,
        ),
    });
}

export function invalidatePageAnalysesCache(
    queryClient: QueryClient,
    documentId: number,
    pageId: number | undefined,
) {
    queryClient.invalidateQueries({
        queryKey: getPageAnalysesQueryKey(documentId, pageId),
    });
}
