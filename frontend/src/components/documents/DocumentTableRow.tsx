import { Link } from 'react-router-dom';

import type { DocumentItem } from '../../types/document';

type DocumentTableRowProps = {
    document: DocumentItem;
    isDeleting?: boolean;
    onDelete: (documentId: number) => void;
};

function formatLanguage(language?: string) {
    if (!language) {
        return '—';
    }

    return language.toUpperCase();
}

function formatStatus(status: string) {
    return status
        .replace(/_/g, ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsedDate);
}

function DocumentTableRow({
                              document,
                              isDeleting = false,
                              onDelete,
                          }: DocumentTableRowProps) {
    const handleDelete = () => {
        const shouldDelete = window.confirm(
            `Are you sure you want to delete the document "${document.name}"?`
        );

        if (!shouldDelete) {
            return;
        }

        onDelete(document.id);
    };

    return (
        <tr>
            <td>
                <div className="document-cell">
                    <span className="document-name">{document.name}</span>
                    <span className="document-meta">
                        ID #{document.id}
                    </span>
                </div>
            </td>

            <td>
                <div className="language-pair">
                    <span className="language-badge">
                        {formatLanguage(document.sourceLanguage)}
                    </span>
                    <span className="language-arrow">→</span>
                    <span className="language-badge">
                        {formatLanguage(document.targetLanguage)}
                    </span>
                </div>
            </td>

            <td>
                <span className="page-count">
                    {document.pageCount ?? 0}
                </span>
            </td>

            <td>
                <span className={`status-badge status-badge-${document.status}`}>
                    {formatStatus(document.status)}
                </span>
            </td>

            <td>{formatDate(document.uploadedAt)}</td>

            <td>
                <div className="table-actions">
                    <Link
                        to={`/documents/${document.id}`}
                        className="table-icon-action"
                        aria-label={`Open ${document.name}`}
                        title="Open document"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </Link>

                    <button
                        type="button"
                        className="table-icon-action table-icon-action-danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label={`Delete ${document.name}`}
                        title="Delete document"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M4 7h16"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M10 11v6M14 11v6"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M6.5 7l.75 13h9.5L17.5 7"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M9 7V4.75h6V7"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default DocumentTableRow;