type DocumentEditorToolbarProps = {
    isOcrDisabled: boolean;
    isOcrRunning: boolean;
    onFormatText: (command: string) => void;
    onRunOcr: () => void;
};

function DocumentEditorToolbar({isOcrDisabled, isOcrRunning, onFormatText, onRunOcr,}: DocumentEditorToolbarProps) {
    return (
        <div className="editor-toolbar">
            <button type="button" onClick={() => onFormatText('bold')}>
                B
            </button>

            <button type="button" onClick={() => onFormatText('italic')}>
                I
            </button>

            <button type="button" onClick={() => onFormatText('justifyLeft')}>
                Left
            </button>

            <button type="button" onClick={() => onFormatText('justifyCenter')}>
                Center
            </button>

            <button type="button" onClick={() => onFormatText('justifyRight')}>
                Right
            </button>

            <button type="button" onClick={onRunOcr} disabled={isOcrDisabled}>
                {isOcrRunning ? 'Reading text...' : 'Get text by OCR'}
            </button>
        </div>
    );
}

export default DocumentEditorToolbar;