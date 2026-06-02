import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import DocumentEditorToolbar from '../components/document-detail/DocumentEditorToolbar';
import DocumentModeSelector from '../components/document-detail/DocumentModeSelector';
import DocumentPagePreview from '../components/document-detail/DocumentPagePreview';
import DocumentPagination from '../components/document-detail/DocumentPagination';
import TargetLanguageSelect from '../components/document-detail/TargetLanguageSelect';

import { documentPages } from '../data/documentPages';
import useOcrSelection from '../hooks/useOcrSelection';
import type { TranslationMode } from '../types/documentViewer';

import './DocumentDetail.css';

function DocumentDetail() {
    const { id } = useParams();

    const imageRef = useRef<HTMLImageElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [translationMode, setTranslationMode] =
        useState<TranslationMode>(null);
    const [targetLanguage, setTargetLanguage] = useState('sr');

    const currentPage = documentPages[currentPageIndex];

    const {
        selectionBox,
        isOcrRunning,
        clearSelection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        runOcr,
    } = useOcrSelection({
        translationMode,
        imageRef,
        editorRef,
    });

    const formatText = (command: string) => {
        document.execCommand(command);
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
            Math.min(current + 1, documentPages.length - 1)
        );
        clearSelection();
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Document #{id}</h1>
                </div>
            </div>

            <div className="workspace-toolbar">
                <DocumentModeSelector
                    translationMode={translationMode}
                    onModeChange={handleModeChange}
                />

                <div className="workspace-toolbar-actions">
                    <TargetLanguageSelect
                        value={targetLanguage}
                        onChange={setTargetLanguage}
                    />

                    <DocumentEditorToolbar
                        isOcrDisabled={!selectionBox || isOcrRunning}
                        isOcrRunning={isOcrRunning}
                        onFormatText={formatText}
                        onRunOcr={runOcr}
                    />
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
                isFirstPage={currentPageIndex === 0}
                isLastPage={currentPageIndex === documentPages.length - 1}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
            />
        </div>
    );
}

export default DocumentDetail;