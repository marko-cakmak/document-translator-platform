import DocumentEditorToolbar from './DocumentEditorToolbar';
import DocumentModeSelector from './DocumentModeSelector';
import TargetLanguageSelect from './TargetLanguageSelect';

import type { DocumentWorkspaceToolbarProps } from '../../types/documentDetailComponents';

function DocumentWorkspaceToolbar({
    translationMode,
    targetLanguage,
    hasSelectionBox,
    isOcrRunning,
    isAnalyzing,
    isAiLoadingVisible,
    onModeChange,
    onTargetLanguageChange,
    onRunOcr,
    onRunAiAnalysis,
    onFormatText,
}: DocumentWorkspaceToolbarProps) {
    const isAiBusy = isAnalyzing || isAiLoadingVisible;

    return (
        <div className="workspace-toolbar">
            <DocumentModeSelector
                translationMode={translationMode}
                onModeChange={onModeChange}
            />

            <div className="workspace-toolbar-actions">
                <div className="toolbar-group toolbar-group-left">
                    <TargetLanguageSelect
                        value={targetLanguage}
                        onChange={onTargetLanguageChange}
                    />

                    <button
                        type="button"
                        className="ocr-button"
                        onClick={onRunOcr}
                        disabled={!hasSelectionBox || isOcrRunning}
                    >
                        {isOcrRunning ? 'Reading text...' : 'Get text by OCR'}
                    </button>

                    <button
                        type="button"
                        className="ocr-button ai-analysis-button"
                        onClick={onRunAiAnalysis}
                        disabled={isAiBusy}
                    >
                        {isAiBusy ? 'Analyzing...' : 'Run AI analysis'}
                    </button>
                </div>

                <div className="toolbar-group toolbar-group-right">
                    <DocumentEditorToolbar onFormatText={onFormatText} />
                </div>
            </div>
        </div>
    );
}

export default DocumentWorkspaceToolbar;
