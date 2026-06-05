import type { SelectionBox } from '../types/documentViewer';
import type {
    ImageCropBox,
    OcrSelectionMouseEvent,
    Point,
} from '../types/ocrSelection';

export function getMousePositionInElement(
    event: OcrSelectionMouseEvent,
): Point {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

export function createSelectionBox(
    startPoint: Point,
    endPoint: Point,
): SelectionBox {
    return {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
    };
}

export function getImageCropBoxFromSelection(
    selectionBox: SelectionBox,
    image: HTMLImageElement,
): ImageCropBox | null {
    const imageRect = image.getBoundingClientRect();
    const parentRect = image.parentElement?.getBoundingClientRect();

    if (!parentRect) {
        return null;
    }

    const selectionXOnImage =
        selectionBox.x - (imageRect.left - parentRect.left);
    const selectionYOnImage =
        selectionBox.y - (imageRect.top - parentRect.top);

    const scaleX = image.naturalWidth / imageRect.width;
    const scaleY = image.naturalHeight / imageRect.height;

    const cropX = Math.max(0, selectionXOnImage * scaleX);
    const cropY = Math.max(0, selectionYOnImage * scaleY);

    const cropWidth = Math.min(
        selectionBox.width * scaleX,
        image.naturalWidth - cropX,
    );

    const cropHeight = Math.min(
        selectionBox.height * scaleY,
        image.naturalHeight - cropY,
    );

    if (cropWidth <= 0 || cropHeight <= 0) {
        return null;
    }

    return {
        x: Math.round(cropX),
        y: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
    };
}

export function appendTextToElement(
    element: HTMLDivElement | null,
    text: string,
) {
    if (!element) {
        return;
    }

    element.innerText += element.innerText
        ? `\n${text}`
        : text;
}
