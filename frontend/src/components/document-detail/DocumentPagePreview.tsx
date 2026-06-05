import DocumentImageStage from './DocumentImageStage';

import type { DocumentPagePreviewProps } from '../../types/documentDetailComponents';

function DocumentPagePreview({
    page,
    translationMode,
    imageRef,
    selectionBox,
    sourceBlocks,
    selectedSourceBlockId,
    onSelectSourceBlock,
    onMouseDown,
    onMouseMove,
    onMouseUp,
}: DocumentPagePreviewProps) {
    const pageClassName =
        translationMode === 'manual'
            ? 'document-page-a4 selectable'
            : 'document-page-a4';

    return (
        <div className="document-preview">
            <div
                className={pageClassName}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                <DocumentImageStage
                    page={page}
                    imageRef={imageRef}
                    selectionBox={selectionBox}
                    sourceBlocks={sourceBlocks}
                    selectedSourceBlockId={selectedSourceBlockId}
                    onSelectSourceBlock={onSelectSourceBlock}
                />
            </div>
        </div>
    );
}

export default DocumentPagePreview;
