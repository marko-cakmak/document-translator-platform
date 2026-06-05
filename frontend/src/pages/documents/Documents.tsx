import DocumentsHeader from './components/DocumentsHeader';
import DocumentsTable from './components/DocumentsTable';
import useDocumentsPage from './hooks/useDocumentsPage';

import './Documents.css';

function Documents() {
    const {
        documents,
        isLoading,
        isError,
        handleDeleteDocument,
        getIsDocumentDeleting,
    } = useDocumentsPage();

    return (
        <div>
            <DocumentsHeader />

            <div className="table-card">
                <DocumentsTable
                    documents={documents}
                    isLoading={isLoading}
                    isError={isError}
                    onDeleteDocument={handleDeleteDocument}
                    getIsDocumentDeleting={getIsDocumentDeleting}
                />
            </div>
        </div>
    );
}

export default Documents;
