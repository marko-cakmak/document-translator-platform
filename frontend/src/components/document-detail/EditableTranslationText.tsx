import {
    useEffect,
    useRef,
} from 'react';

import type { EditableTranslationTextProps } from '../../types/documentDetailComponents';

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

export default EditableTranslationText;
