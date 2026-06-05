import type { SelectionBoxOverlayProps } from '../../types/documentDetailComponents';

function SelectionBoxOverlay({
    selectionBox,
}: SelectionBoxOverlayProps) {
    if (!selectionBox) {
        return null;
    }

    return (
        <div
            className="ocr-selection-box"
            style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
            }}
        />
    );
}

export default SelectionBoxOverlay;
