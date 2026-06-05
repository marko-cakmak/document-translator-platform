import type { MouseEventHandler, Ref } from 'react';
import type {
    AnalysisSourceBlock,
    DocumentPage,
    SelectionBox,
    TranslationMode,
} from '../../types/documentViewer';

type DocumentPagePreviewProps = {
    page: DocumentPage;
    translationMode: TranslationMode;
    imageRef: Ref<HTMLImageElement>;
    selectionBox: SelectionBox | null;
    sourceBlocks: AnalysisSourceBlock[];
    selectedSourceBlockId: string | null;
    onSelectSourceBlock: (clientId: string) => void;
    onMouseDown: MouseEventHandler<HTMLDivElement>;
    onMouseMove: MouseEventHandler<HTMLDivElement>;
    onMouseUp: MouseEventHandler<HTMLDivElement>;
};

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
                <div className="document-image-stage">
                    <img
                        ref={imageRef}
                        src={page.image}
                        alt={`Document page ${page.pageNumber}`}
                        className="document-image"
                        draggable={false}
                    />

                    {sourceBlocks.map((block, index) => {
                        const isSelected =
                            selectedSourceBlockId === block.clientId;

                        return (
                            <button
                                key={block.clientId}
                                type="button"
                                className={
                                    isSelected
                                        ? 'analysis-source-box analysis-source-box-active'
                                        : 'analysis-source-box'
                                }
                                style={{
                                    left: `${(block.sourceBox.x / page.width) * 100}%`,
                                    top: `${(block.sourceBox.y / page.height) * 100}%`,
                                    width: `${(block.sourceBox.width / page.width) * 100}%`,
                                    height: `${(block.sourceBox.height / page.height) * 100}%`,
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelectSourceBlock(block.clientId);
                                }}
                                title={block.sourceText}
                            >
                                <span>{index + 1}</span>
                            </button>
                        );
                    })}

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
        </div>
    );
}

export default DocumentPagePreview;