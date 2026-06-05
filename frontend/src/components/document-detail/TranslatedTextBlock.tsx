import EditableTranslationText from './EditableTranslationText';

import type { TranslatedTextBlockProps } from '../../types/documentDetailComponents';
import {
    getBlockStatusLabel,
    getTranslatedBlockStyle,
    isBlockApproved,
} from '../../utils/translationBlocks';

function TranslatedTextBlock({
    page,
    block,
    blockNumber,
    isSelected,
    isSaving,
    isApproving,
    onSelectSourceBlock,
    onChangeTranslatedText,
    onSaveSelectedBlock,
    onApproveSelectedBlock,
}: TranslatedTextBlockProps) {
    const approved = isBlockApproved(block);
    const statusLabel = getBlockStatusLabel(block.status);

    return (
        <div
            className={
                isSelected
                    ? 'translated-text-block translated-text-block-active'
                    : 'translated-text-block'
            }
            style={getTranslatedBlockStyle(block, page)}
            onClick={() => onSelectSourceBlock(block.sourceClientId)}
        >
            <span className="translated-text-block-number">
                {blockNumber}
            </span>

            <span
                className={
                    approved
                        ? 'translated-text-status translated-text-status-approved'
                        : 'translated-text-status translated-text-status-draft'
                }
            >
                {statusLabel}
            </span>

            {isSelected && (
                <div className="translated-text-actions">
                    <button
                        type="button"
                        className="translated-text-save-button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onSaveSelectedBlock();
                        }}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save changes'}
                    </button>

                    <button
                        type="button"
                        className={
                            approved
                                ? 'translated-text-approve-button approved'
                                : 'translated-text-approve-button'
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                            onApproveSelectedBlock();
                        }}
                        disabled={isApproving || !block.id}
                    >
                        {isApproving
                            ? 'Approving...'
                            : approved
                                ? 'Approved'
                                : 'Approve block'}
                    </button>
                </div>
            )}

            <EditableTranslationText
                block={block}
                onSelectSourceBlock={onSelectSourceBlock}
                onChangeTranslatedText={onChangeTranslatedText}
            />
        </div>
    );
}

export default TranslatedTextBlock;
