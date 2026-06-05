import {
    useEffect,
    useRef,
} from 'react';

import type {
    AnalysisTranslationBlock,
    DocumentPage,
} from '../../types/documentViewer';

type AnalysisTranslationPanelProps = {
    page: DocumentPage;
    translationBlocks: AnalysisTranslationBlock[];
    selectedSourceBlockId: string | null;
    savingSourceBlockId: string | null;
    approvingTranslationId: number | null;
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
    onSaveSelectedBlock: () => void;
    onApproveSelectedBlock: () => void;
};

type EditableTranslationTextProps = {
    block: AnalysisTranslationBlock;
    onSelectSourceBlock: (sourceClientId: string) => void;
    onChangeTranslatedText: (clientId: string, translatedText: string) => void;
};

function EditableTranslationText({
    block,
    onSelectSourceBlock,
    onChangeTranslatedText,
}: EditableTranslationTextProps) {
    const editableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const editableElement = editableRef.current;

        if (!editableElement) {
            return;
        }

        const isFocused = document.activeElement === editableElement;

        if (isFocused) {
            return;
        }

        if (editableElement.innerText !== block.translatedText) {
            editableElement.innerText = block.translatedText;
        }
    }, [block.clientId, block.translatedText]);

    return (
        <div
            ref={editableRef}
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
            onFocus={() => {
                onSelectSourceBlock(block.sourceClientId);
            }}
        />
    );
}

function getBlockStatusLabel(status?: string) {
    if (status === 'approved') {
        return 'approved';
    }

    if (status === 'reviewed') {
        return 'reviewed';
    }

    return 'draft';
}

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
                {translationBlocks.map((block, index) => {
                    const isSelected =
                        selectedSourceBlockId === block.sourceClientId;
                    const isSaving =
                        savingSourceBlockId === block.sourceClientId;
                    const isApproving =
                        approvingTranslationId === block.id;
                    const statusLabel = getBlockStatusLabel(block.status);
                    const isApproved = block.status === 'approved';

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

                            <span
                                className={
                                    isApproved
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
                                            isApproved
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
                                            : isApproved
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
                })}
            </div>
        </div>
    );
}

export default AnalysisTranslationPanel;
