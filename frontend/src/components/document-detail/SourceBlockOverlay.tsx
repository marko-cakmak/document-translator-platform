import type { SourceBlockOverlayProps } from '../../types/documentDetailComponents';
import { getSourceBlockStyle } from '../../utils/sourceBlocks';

function SourceBlockOverlay({
    page,
    block,
    blockNumber,
    isSelected,
    onSelectSourceBlock,
}: SourceBlockOverlayProps) {
    return (
        <button
            type="button"
            className={
                isSelected
                    ? 'analysis-source-box analysis-source-box-active'
                    : 'analysis-source-box'
            }
            style={getSourceBlockStyle(block, page)}
            onClick={(event) => {
                event.stopPropagation();
                onSelectSourceBlock(block.clientId);
            }}
            title={block.sourceText}
        >
            <span>{blockNumber}</span>
        </button>
    );
}

export default SourceBlockOverlay;
