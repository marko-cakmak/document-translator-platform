import type { TranslationMode } from '../../types/documentViewer';

type DocumentModeSelectorProps = {
    translationMode: TranslationMode;
    onModeChange: (mode: TranslationMode) => void;
};

function DocumentModeSelector({translationMode, onModeChange,}: DocumentModeSelectorProps) {
    return (
        <div className="mode-selector">
            <button
                type="button"
                className={
                    translationMode === 'manual'
                        ? 'mode-card active'
                        : 'mode-card'
                }
                onClick={() => onModeChange('manual')}
            >
                <strong>Manual translation</strong>
            </button>

            <button
                type="button"
                className={
                    translationMode === 'ai'
                        ? 'mode-card active'
                        : 'mode-card'
                }
                onClick={() => onModeChange('ai')}
            >
                <strong>AI analysis</strong>
            </button>
        </div>
    );
}

export default DocumentModeSelector;