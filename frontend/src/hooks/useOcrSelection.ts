import { useState, type MouseEvent, type RefObject } from 'react';

import { runPageOcr } from '../services/documentsApi';
import type {
    SelectionBox,
    TranslationMode,
} from '../types/documentViewer';

type Point = {
    x: number;
    y: number;
};

type UseOcrSelectionArgs = {
    documentId: number;
    pageId?: number;
    sourceLanguage?: string;
    translationMode: TranslationMode;
    imageRef: RefObject<HTMLImageElement | null>;
    editorRef: RefObject<HTMLDivElement | null>;
};

function useOcrSelection({
                             documentId,
                             pageId,
                             sourceLanguage = 'en',
                             translationMode,
                             imageRef,
                             editorRef,
                         }: UseOcrSelectionArgs) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<Point>({
        x: 0,
        y: 0,
    });
    const [selectionBox, setSelectionBox] =
        useState<SelectionBox | null>(null);
    const [isOcrRunning, setIsOcrRunning] = useState(false);

    const clearSelection = () => {
        setSelectionBox(null);
    };

    const getMousePosition = (
        event: MouseEvent<HTMLDivElement>,
    ): Point => {
        const rect = event.currentTarget.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (translationMode !== 'manual') {
            return;
        }

        const position = getMousePosition(event);

        setIsSelecting(true);
        setSelectionStart(position);
        setSelectionBox({
            x: position.x,
            y: position.y,
            width: 0,
            height: 0,
        });
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || translationMode !== 'manual') {
            return;
        }

        const position = getMousePosition(event);

        setSelectionBox({
            x: Math.min(selectionStart.x, position.x),
            y: Math.min(selectionStart.y, position.y),
            width: Math.abs(position.x - selectionStart.x),
            height: Math.abs(position.y - selectionStart.y),
        });
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
    };

    const appendTextToEditor = (text: string) => {
        if (!editorRef.current) {
            return;
        }

        editorRef.current.innerText += editorRef.current.innerText
            ? `\n${text}`
            : text;
    };

    const runOcr = async () => {
        if (!selectionBox || !imageRef.current || !pageId) {
            return;
        }

        setIsOcrRunning(true);

        try {
            const image = imageRef.current;
            const imageRect = image.getBoundingClientRect();
            const parentRect = image.parentElement?.getBoundingClientRect();

            if (!parentRect) {
                return;
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
                appendTextToEditor('[OCR selection is outside of the page image.]');
                return;
            }

            const response = await runPageOcr({
                documentId,
                pageId,
                x: Math.round(cropX),
                y: Math.round(cropY),
                width: Math.round(cropWidth),
                height: Math.round(cropHeight),
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