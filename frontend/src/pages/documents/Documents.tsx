import { Link } from 'react-router-dom';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import DocumentTableRow from '../../components/documents/DocumentTableRow';
import { documentsQuery } from '../../queries/documentsQueries';
import { deleteDocument } from '../../services/documentsApi';

import './Documents.css';

function Documents() {
    const queryClient = useQueryClient();

    const {
        data: documents = [],
        isLoading,
        isError,
        error,
    } = useQuery(documentsQuery);

    const deleteMutation = useMutation({
        mutationFn: deleteDocument,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['documents'],
            });
        },
        onError: (deleteError) => {
            console.error('Failed to delete document:', deleteError);
            window.alert('Brisanje dokumenta nije uspelo.');
        },
    });

    if (isError) {
        console.error('Failed to load documents:', error);
    }

    const handleDeleteDocument = (documentId: number) => {
        deleteMutation.mutate(documentId);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-description">
                        Pregled uploadovanih dokumenata za prevod.
                    </p>
                </div>

                <Link to="/documents/upload" className="primary-button">
                    Upload new document
                </Link>
            </div>

            <div className="table-card">
                {isLoading && (
                    <div className="documents-state">
                        Loading documents...
                    </div>
                )}

                {!isLoading && isError && (
                    <div className="documents-state documents-state-error">
                        Nije moguće učitati dokumente sa servera.
                    </div>
                )}

                {!isLoading && !isError && documents.length === 0 && (
                    <div className="documents-state">
                        No documents uploaded yet.
                    </div>
                )}

                {!isLoading && !isError && documents.length > 0 && (
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
                                isDeleting={
                                    deleteMutation.isPending &&
                                    deleteMutation.variables === document.id
                                }
                                onDelete={handleDeleteDocument}
                            />
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Documents;