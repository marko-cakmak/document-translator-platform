import type { MouseEventHandler, Ref } from 'react';
import type {
    DocumentPage,
    SelectionBox,
    TranslationMode,
} from '../../types/documentViewer';

type DocumentPagePreviewProps = {
    page: DocumentPage;
    translationMode: TranslationMode;
    imageRef: Ref<HTMLImageElement>;
    selectionBox: SelectionBox | null;
    onMouseDown: MouseEventHandler<HTMLDivElement>;
    onMouseMove: MouseEventHandler<HTMLDivElement>;
    onMouseUp: MouseEventHandler<HTMLDivElement>;
};

function DocumentPagePreview({ page, translationMode, imageRef, selectionBox, onMouseDown, onMouseMove, onMouseUp }: DocumentPagePreviewProps) {
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
                <img
                    ref={imageRef}
                    src={page.image}
                    alt={`Document page ${page.pageNumber}`}
                    className="document-image"
                    draggable={false}
                />

                {selectionBox && (
                    <div
                        className="ocr-selection-box"
                        style={{
                            left: selectionBox.x,
                            top: selectionBox.y,
                            width: selectionBox.width,
                            height: selectionBox.height,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default DocumentPagePreview;