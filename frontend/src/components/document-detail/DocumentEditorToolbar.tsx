type DocumentEditorToolbarProps = {
    onFormatText: (command: string, value?: string) => void;
};

function DocumentEditorToolbar({ onFormatText }: DocumentEditorToolbarProps) {
    return (
        <div className="editor-toolbar">
            <button type="button" onClick={() => onFormatText('bold')}>
                B
            </button>

            <button type="button" onClick={() => onFormatText('italic')}>
                I
            </button>

            <button type="button" onClick={() => onFormatText('nudgeLeft')}>
                ←
            </button>

            <button type="button" onClick={() => onFormatText('justifyCenter')}>
                Center
            </button>

            <button type="button" onClick={() => onFormatText('nudgeRight')}>
                →
            </button>

            <button type="button" onClick={() => onFormatText('decreaseFontSize')}>
                A-
            </button>

            <button type="button" onClick={() => onFormatText('increaseFontSize')}>
                A+
            </button>

            <select
                defaultValue=""
                onChange={(event) => {
                    const fontSize = event.target.value;

                    if (fontSize) {
                        onFormatText('fontSize', fontSize);
                    }
                }}
            >
                <option value="" disabled>
                    Size
                </option>
                <option value="10px">10</option>
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="28px">28</option>
                <option value="32px">32</option>
                <option value="36px">36</option>
            </select>
        </div>
    );
}

export default DocumentEditorToolbar;