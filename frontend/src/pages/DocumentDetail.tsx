import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import DocumentEditorToolbar from '../components/document-detail/DocumentEditorToolbar';
import DocumentModeSelector from '../components/document-detail/DocumentModeSelector';
import DocumentPagePreview from '../components/document-detail/DocumentPagePreview';
import DocumentPagination from '../components/document-detail/DocumentPagination';
import TargetLanguageSelect from '../components/document-detail/TargetLanguageSelect';

import useOcrSelection from '../hooks/useOcrSelection';
import { documentDetailQuery } from '../queries/documentsQueries';
import type {
    DocumentPage,
    TranslationMode,
} from '../types/documentViewer';

import './DocumentDetail.css';

function DocumentDetail() {
    const { id } = useParams();

    const documentId = Number(id);
    const isValidDocumentId = Number.isFinite(documentId) && documentId > 0;

    const imageRef = useRef<HTMLImageElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [translationMode, setTranslationMode] =
        useState<TranslationMode>(null);
    const [targetLanguage, setTargetLanguage] = useState('sr');

    const {
        data: documentData,
        isLoading,
        isError,
        error,
    } = useQuery({
        ...documentDetailQuery(documentId),
        enabled: isValidDocumentId,
    });

    if (isError) {
        console.error('Failed to load document:', error);
    }

    const documentPages: DocumentPage[] =
        documentData?.pages
            .filter((page) => Boolean(page.imageUrl))
            .map((page) => ({
                id: page.id,
                pageNumber: page.pageNumber,
                image: page.imageUrl as string,
            })) ?? [];

    const safeCurrentPageIndex = Math.min(
        currentPageIndex,
        Math.max(documentPages.length - 1, 0),
    );

    const currentPage = documentPages[safeCurrentPageIndex];

    const {
        selectionBox,
        isOcrRunning,
        clearSelection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        runOcr,
    } = useOcrSelection({
        documentId,
        pageId: currentPage?.id,
        sourceLanguage: documentData?.sourceLanguage,
        translationMode,
        imageRef,
        editorRef,
    });

    const applyStyleToSelection = (styles: Partial<CSSStyleDeclaration>) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        Object.assign(span.style, styles);

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const nudgeSelection = (deltaX: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        span.style.position = 'relative';
        span.style.left = `${deltaX}px`;
        span.style.display = 'inline-block';

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const changeSelectedFontSize = (delta: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const parentElement =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer as HTMLElement;

        const currentFontSize = parentElement
            ? window.getComputedStyle(parentElement).fontSize
            : '16px';

        const currentSize =
            parseInt(currentFontSize.replace('px', ''), 10) || 16;

        const nextSize = Math.max(8, currentSize + delta);

        applyStyleToSelection({
            fontSize: `${nextSize}px`,
        });
    };

    const formatText = (command: string, value?: string) => {
        if (
            command === 'bold' ||
            command === 'italic' ||
            command === 'justifyCenter'
        ) {
            window.document.execCommand(command);
            return;
        }

        if (command === 'fontSize' && value) {
            applyStyleToSelection({
                fontSize: value,
            });
            return;
        }

        if (command === 'increaseFontSize') {
            changeSelectedFontSize(2);
            return;
        }

        if (command === 'decreaseFontSize') {
            changeSelectedFontSize(-2);
            return;
        }

        if (command === 'nudgeLeft') {
            nudgeSelection(-10);
            return;
        }

        if (command === 'nudgeRight') {
            nudgeSelection(10);
        }
    };

    const handleModeChange = (mode: TranslationMode) => {
        setTranslationMode(mode);
        clearSelection();
    };

    const goToPreviousPage = () => {
        setCurrentPageIndex((current) => Math.max(current - 1, 0));
        clearSelection();
    };

    const goToNextPage = () => {
        setCurrentPageIndex((current) =>
            Math.min(current + 1, documentPages.length - 1),
        );
        clearSelection();
    };

    if (!isValidDocumentId) {
        return (
            <div className="document-detail-state">
                Invalid document ID.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="document-detail-state">
                Loading document...
            </div>
        );
    }

    if (isError || !documentData) {
        return (
            <div className="document-detail-state document-detail-state-error">
                Nije moguće učitati dokument.
            </div>
        );
    }

    if (!currentPage) {
        return (
            <div>
                <div className="document-detail-mini-header">
                    <h1>{documentData.name}</h1>
                </div>

                <div className="document-detail-state">
                    No pages found for this document.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="document-detail-mini-header">
                <h1>{documentData.name}</h1>
            </div>

            <div className="workspace-toolbar">
                <DocumentModeSelector
                    translationMode={translationMode}
                    onModeChange={handleModeChange}
                />

                <div className="workspace-toolbar-actions">
                    <div className="toolbar-group toolbar-group-left">
                        <TargetLanguageSelect
                            value={targetLanguage}
                            onChange={setTargetLanguage}
                        />

                        <button
                            type="button"
                            className="ocr-button"
                            onClick={runOcr}
                            disabled={!selectionBox || isOcrRunning}
                        >
                            {isOcrRunning ? 'Reading text...' : 'Get text by OCR'}
                        </button>
                    </div>

                    <div className="toolbar-group toolbar-group-right">
                        <DocumentEditorToolbar onFormatText={formatText} />
                    </div>
                </div>
            </div>

            <div className="document-workspace">
                <DocumentPagePreview
                    page={currentPage}
                    translationMode={translationMode}
                    imageRef={imageRef}
                    selectionBox={selectionBox}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />

                <div className="translation-panel">
                    <div
                        ref={editorRef}
                        className="translation-editor"
                        contentEditable
                        suppressContentEditableWarning
                    />
                </div>
            </div>

            <DocumentPagination
                currentPageNumber={currentPage.pageNumber}
                totalPages={documentPages.length}
                isFirstPage={safeCurrentPageIndex === 0}
                isLastPage={safeCurrentPageIndex === documentPages.length - 1}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
            />
        </div>
    );
}

export default DocumentDetail;