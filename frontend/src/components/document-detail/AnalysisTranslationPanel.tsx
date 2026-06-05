import type {
    AnalysisTranslationBlock,
    DocumentPage,
} from '../../types/documentViewer';

type AnalysisTranslationPanelProps = {
    page: DocumentPage;
    translationBlocks: AnalysisTranslationBlock[];
    selectedSourceBlockId: string | null;
    savingSourceBlockId: string | null;
    savedSourceBlockIds: string[];
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
    onSaveSelectedBlock: () => void;
};

function AnalysisTranslationPanel({
    page,
    translationBlocks,
    selectedSourceBlockId,
    savingSourceBlockId,
    savedSourceBlockIds,
    onSelectSourceBlock,
    onChangeTranslatedText,
    onSaveSelectedBlock,
}: AnalysisTranslationPanelProps) {
    if (translationBlocks.length === 0) {
        return (
            <div className="analysis-empty-state">
                Run AI analysis to generate translated template blocks.
            </div>
        );
    }

    return (
        <div className="translated-page-wrapper">
            <div className="translated-page-stage">
                {translationBlocks.map((block, index) => {
                    const isSelected =
                        selectedSourceBlockId === block.sourceClientId;
                    const isSaving =
                        savingSourceBlockId === block.sourceClientId;
                    const isSaved =
                        savedSourceBlockIds.includes(block.sourceClientId);

                    return (
                        <div
                            key={block.clientId}
                            className={
                                isSelected
                                    ? 'translated-text-block translated-text-block-active'
                                    : 'translated-text-block'
                            }
                            style={{
                                left: `${(block.targetBox.x / page.width) * 100}%`,
                                top: `${(block.targetBox.y / page.height) * 100}%`,
                                minWidth: `${(block.targetBox.width / page.width) * 100}%`,
                                maxWidth: `${(block.targetBox.width / page.width) * 100}%`,
                                ...block.css,
                            }}
                            onClick={() => onSelectSourceBlock(block.sourceClientId)}
                        >
                            <span className="translated-text-block-number">
                                {index + 1}
                            </span>

                            {isSelected && (
                                <button
                                    type="button"
                                    className="translated-text-save-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSaveSelectedBlock();
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : isSaved
                                            ? 'Saved'
                                            : 'Save block'}
                                </button>
                            )}

                            <div
                                className="translated-text-editable"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(event) => {
                                    onChangeTranslatedText(
                                        block.clientId,
                                        event.currentTarget.innerText,
                                    );
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelectSourceBlock(block.sourceClientId);
                                }}
                            >
                                {block.translatedText}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AnalysisTranslationPanel;
