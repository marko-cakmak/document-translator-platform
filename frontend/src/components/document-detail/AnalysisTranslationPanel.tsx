import TranslatedTextBlock from './TranslatedTextBlock';

import type { AnalysisTranslationPanelProps } from '../../types/documentDetailComponents';

function AnalysisTranslationPanel({
    page,
    translationBlocks,
    selectedSourceBlockId,
    savingSourceBlockId,
    approvingTranslationId,
    onSelectSourceBlock,
    onChangeTranslatedText,
    onSaveSelectedBlock,
    onApproveSelectedBlock,
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
                {translationBlocks.map((block, index) => (
                    <TranslatedTextBlock
                        key={block.clientId}
                        page={page}
                        block={block}
                        blockNumber={index + 1}
                        isSelected={selectedSourceBlockId === block.sourceClientId}
                        isSaving={savingSourceBlockId === block.sourceClientId}
                        isApproving={approvingTranslationId === block.id}
                        onSelectSourceBlock={onSelectSourceBlock}
                        onChangeTranslatedText={onChangeTranslatedText}
                        onSaveSelectedBlock={onSaveSelectedBlock}
                        onApproveSelectedBlock={onApproveSelectedBlock}
                    />
                ))}
            </div>
        </div>
    );
}

export default AnalysisTranslationPanel;
