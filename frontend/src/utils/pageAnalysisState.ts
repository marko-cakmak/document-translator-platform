import type {
    AnalysisSourceBlock,
    AnalysisTranslationBlock,
    PageAnalysisResult,
} from '../types/documentViewer';

export function getSourceBlocksForPage(
    analysisResult: PageAnalysisResult | null,
    pageId?: number,
): AnalysisSourceBlock[] {
    if (!analysisResult || !pageId || analysisResult.pageId !== pageId) {
        return [];
    }

    return analysisResult.sourceBlocks;
}

export function getTranslationBlocksForPage(
    analysisResult: PageAnalysisResult | null,
    pageId?: number,
): AnalysisTranslationBlock[] {
    if (!analysisResult || !pageId || analysisResult.pageId !== pageId) {
        return [];
    }

    return analysisResult.translationBlocks;
}

export function getSelectedTranslationBlock(
    translationBlocks: AnalysisTranslationBlock[],
    selectedSourceBlockId: string | null,
) {
    if (!selectedSourceBlockId) {
        return null;
    }

    return translationBlocks.find(
        (block) => block.sourceClientId === selectedSourceBlockId,
    ) ?? null;
}

export function getNextSelectedSourceBlockId(
    analysisResult: PageAnalysisResult,
    currentSelectedId: string | null,
) {
    const blockIds = analysisResult.sourceBlocks.map(
        (block) => block.clientId,
    );

    if (currentSelectedId && blockIds.includes(currentSelectedId)) {
        return currentSelectedId;
    }

    return analysisResult.sourceBlocks[0]?.clientId ?? null;
}

export function updateTranslatedTextInAnalysisResult(
    currentResult: PageAnalysisResult | null,
    clientId: string,
    translatedText: string,
): PageAnalysisResult | null {
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
}
