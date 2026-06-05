import type {
    AnalysisTranslationBlock,
    PageAnalysisSummary,
} from '../types/documentViewer';

export function getAnalysisLabel(analysis: PageAnalysisSummary) {
    return analysis.name;
}

export function getAnalysisStatusLabel(status?: string) {
    if (status === 'saved') {
        return 'saved';
    }

    if (status === 'draft') {
        return 'draft';
    }

    if (status === 'archived') {
        return 'archived';
    }

    if (status === 'discarded') {
        return 'discarded';
    }

    return status ?? 'draft';
}

export function getApprovedCount(
    translationBlocks: AnalysisTranslationBlock[],
) {
    return translationBlocks.filter((block) => block.status === 'approved').length;
}

export function areAllBlocksApproved(
    translationBlocks: AnalysisTranslationBlock[],
) {
    return (
        translationBlocks.length > 0 &&
        getApprovedCount(translationBlocks) === translationBlocks.length
    );
}
