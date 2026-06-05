import type { DocumentDetailItem } from '../types/document';
import type { DocumentPage } from '../types/documentViewer';

export function getDocumentViewerPages(
    documentData?: DocumentDetailItem,
): DocumentPage[] {
    if (!documentData) {
        return [];
    }

    return documentData.pages
        .filter((page) => Boolean(page.imageUrl))
        .map((page) => ({
            id: page.id,
            pageNumber: page.pageNumber,
            image: page.imageUrl as string,
            width: page.width,
            height: page.height,
        }));
}

export function getSafePageIndex(
    currentPageIndex: number,
    totalPages: number,
) {
    return Math.min(
        currentPageIndex,
        Math.max(totalPages - 1, 0),
    );
}
