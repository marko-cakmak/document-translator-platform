import DocumentTableRow from '../../../components/documents/DocumentTableRow';
import type { DocumentItem } from '../../../types/document';

type DocumentsTableProps = {
    documents: DocumentItem[];
    isLoading: boolean;
    isError: boolean;
    onDeleteDocument: (documentId: number) => void;
    getIsDocumentDeleting: (documentId: number) => boolean;
};

function DocumentsTable({ documents, isLoading, isError, onDeleteDocument, getIsDocumentDeleting }: DocumentsTableProps) {
    if (isLoading) {
        return (
            <div className="documents-state">
                Loading documents...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="documents-state documents-state-error">
                Unable to load documents from the server.
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="documents-state">
                No documents uploaded yet.
            </div>
        );
    }

    return (
        <table className="documents-table">
            <thead>
            <tr>
                <th>Document</th>
                <th>Languages</th>
                <th>Pages</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
            </tr>
            </thead>

            <tbody>
            {documents.map((document) => (
                <DocumentTableRow
                    key={document.id}
                    document={document}
                    isDeleting={getIsDocumentDeleting(document.id)}
                    onDelete={onDeleteDocument}
                />
            ))}
            </tbody>
        </table>
    );
}

export default DocumentsTable;
