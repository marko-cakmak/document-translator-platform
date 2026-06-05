import type {
    AnalysisTranslationBlock,
    DocumentPage,
} from '../types/documentViewer';

export function getBlockStatusLabel(status?: string) {
    if (status === 'approved') {
        return 'approved';
    }

    if (status === 'reviewed') {
        return 'reviewed';
    }

    return 'draft';
}

export function isBlockApproved(block: AnalysisTranslationBlock) {
    return block.status === 'approved';
}

export function getTranslatedBlockStyle(
    block: AnalysisTranslationBlock,
    page: DocumentPage,
) {
    return {
        left: `${(block.targetBox.x / page.width) * 100}%`,
        top: `${(block.targetBox.y / page.height) * 100}%`,
        minWidth: `${(block.targetBox.width / page.width) * 100}%`,
        maxWidth: `${(block.targetBox.width / page.width) * 100}%`,
        ...block.css,
    };
}
