import SelectionBoxOverlay from './SelectionBoxOverlay';
import SourceBlockOverlay from './SourceBlockOverlay';

import type { DocumentImageStageProps } from '../../types/documentDetailComponents';

function DocumentImageStage({
    page,
    imageRef,
    selectionBox,
    sourceBlocks,
    selectedSourceBlockId,
    onSelectSourceBlock,
}: DocumentImageStageProps) {
    return (
        <div className="document-image-stage">
            <img
                ref={imageRef}
                src={page.image}
                alt={`Document page ${page.pageNumber}`}
                className="document-image"
                draggable={false}
            />

            {sourceBlocks.map((block, index) => (
                <SourceBlockOverlay
                    key={block.clientId}
                    page={page}
                    block={block}
                    blockNumber={index + 1}
                    isSelected={selectedSourceBlockId === block.clientId}
                    onSelectSourceBlock={onSelectSourceBlock}
                />
            ))}

            <SelectionBoxOverlay selectionBox={selectionBox} />
        </div>
    );
}

export default DocumentImageStage;
