import type {
    MouseEvent,
    RefObject,
} from 'react';

import type {
    SelectionBox,
    TranslationMode,
} from './documentViewer';

export type Point = {
    x: number;
    y: number;
};

export type ImageCropBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type UseOcrSelectionArgs = {
    documentId: number;
    pageId?: number;
    sourceLanguage?: string;
    translationMode: TranslationMode;
    imageRef: RefObject<HTMLImageElement | null>;
    editorRef: RefObject<HTMLDivElement | null>;
};

export type OcrSelectionMouseEvent = MouseEvent<HTMLDivElement>;

export type SelectionBoxWithNullable = SelectionBox | null;
