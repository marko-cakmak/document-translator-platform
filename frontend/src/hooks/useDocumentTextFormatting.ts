function useDocumentTextFormatting() {
    const applyStyleToSelection = (styles: Partial<CSSStyleDeclaration>) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        Object.assign(span.style, styles);

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const nudgeSelection = (deltaX: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const span = window.document.createElement('span');

        span.style.position = 'relative';
        span.style.left = `${deltaX}px`;
        span.style.display = 'inline-block';

        span.appendChild(range.extractContents());
        range.insertNode(span);

        selection.removeAllRanges();

        const newRange = window.document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    };

    const changeSelectedFontSize = (delta: number) => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return;
        }

        const parentElement =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer as HTMLElement;

        const currentFontSize = parentElement
            ? window.getComputedStyle(parentElement).fontSize
            : '16px';

        const currentSize =
            parseInt(currentFontSize.replace('px', ''), 10) || 16;

        const nextSize = Math.max(8, currentSize + delta);

        applyStyleToSelection({
            fontSize: `${nextSize}px`,
        });
    };

    const formatText = (command: string, value?: string) => {
        if (
            command === 'bold' ||
            command === 'italic' ||
            command === 'justifyCenter'
        ) {
            window.document.execCommand(command);
            return;
        }

        if (command === 'fontSize' && value) {
            applyStyleToSelection({
                fontSize: value,
            });
            return;
        }

        if (command === 'increaseFontSize') {
            changeSelectedFontSize(2);
            return;
        }

        if (command === 'decreaseFontSize') {
            changeSelectedFontSize(-2);
            return;
        }

        if (command === 'nudgeLeft') {
            nudgeSelection(-10);
            return;
        }

        if (command === 'nudgeRight') {
            nudgeSelection(10);
        }
    };

    return {
        formatText,
    };
}

export default useDocumentTextFormatting;
