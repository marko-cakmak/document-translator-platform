import { useState } from 'react';

import { runPageOcr } from '../services/documentsApi';
import type { SelectionBox } from '../types/documentViewer';
import type {
    OcrSelectionMouseEvent,
    Point,
    UseOcrSelectionArgs,
} from '../types/ocrSelection';
import {
    appendTextToElement,
    createSelectionBox,
    getImageCropBoxFromSelection,
    getMousePositionInElement,
} from '../utils/ocrSelection';

function useOcrSelection({ documentId, pageId, sourceLanguage = 'en', translationMode, imageRef, editorRef }: UseOcrSelectionArgs) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<Point>({ x: 0, y: 0 });
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [isOcrRunning, setIsOcrRunning] = useState(false);

    const clearSelection = () => { setSelectionBox(null) };

    const handleMouseDown = (event: OcrSelectionMouseEvent) => {
        if (translationMode !== 'manual') {
            return;
        }

        const position = getMousePositionInElement(event);

        setIsSelecting(true);
        setSelectionStart(position);
        setSelectionBox({
            x: position.x,
            y: position.y,
            width: 0,
            height: 0,
        });
    };

    const handleMouseMove = (event: OcrSelectionMouseEvent) => {
        if (!isSelecting || translationMode !== 'manual') {
            return;
        }

        const position = getMousePositionInElement(event);

        setSelectionBox(
            createSelectionBox(selectionStart, position),
        );
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
    };

    const appendTextToEditor = (text: string) => {
        appendTextToElement(editorRef.current, text);
    };

    const runOcr = async () => {
        if (!selectionBox || !imageRef.current || !pageId) {
            return;
        }

        setIsOcrRunning(true);

        try {
            const cropBox = getImageCropBoxFromSelection(
                selectionBox,
                imageRef.current,
            );

            if (!cropBox) {
                appendTextToEditor('[OCR selection is outside of the page image.]');
                return;
            }

            const response = await runPageOcr({
                documentId,
                pageId,
                x: cropBox.x,
                y: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
                language: sourceLanguage,
            });

            if (response.text) {
                appendTextToEditor(response.text);
                clearSelection();
                return;
            }

            appendTextToEditor('[OCR did not find readable text in this selection.]');
        } catch (error) {
            console.error('OCR failed:', error);
            appendTextToEditor('[OCR failed. Check browser console for details.]');
        } finally {
            setIsOcrRunning(false);
        }
    };

    return {
        selectionBox,
        isOcrRunning,
        clearSelection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        runOcr,
    };
}

export default useOcrSelection;
