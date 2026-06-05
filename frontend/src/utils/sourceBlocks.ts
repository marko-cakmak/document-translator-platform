import type {
    AnalysisSourceBlock,
    DocumentPage,
} from '../types/documentViewer';

export function getSourceBlockStyle(
    block: AnalysisSourceBlock,
    page: DocumentPage,
) {
    return {
        left: `${(block.sourceBox.x / page.width) * 100}%`,
        top: `${(block.sourceBox.y / page.height) * 100}%`,
        width: `${(block.sourceBox.width / page.width) * 100}%`,
        height: `${(block.sourceBox.height / page.height) * 100}%`,
    };
}
