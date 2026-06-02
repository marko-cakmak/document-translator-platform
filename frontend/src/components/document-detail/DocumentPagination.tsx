type DocumentPaginationProps = {
    currentPageNumber: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
};

function DocumentPagination({currentPageNumber, totalPages, isFirstPage, isLastPage, onPreviousPage, onNextPage,}: DocumentPaginationProps) {
    return (
        <div className="document-toolbar">
            <div className="page-pagination">
                <button onClick={onPreviousPage} disabled={isFirstPage}>
                    ‹
                </button>

                <span>
                    Page {currentPageNumber} of {totalPages}
                </span>

                <button onClick={onNextPage} disabled={isLastPage}>
                    ›
                </button>
            </div>
        </div>
    );
}

export default DocumentPagination;