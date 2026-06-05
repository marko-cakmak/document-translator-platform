import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { documentsQuery } from '../../../queries/documentsQueries';
import { deleteDocument } from '../../../services/documentsApi';

function useDocumentsPage() {
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
            window.alert('Deleting document failed.');
        },
    });

    if (isError) {
        console.error('Failed to load documents:', error);
    }

    const handleDeleteDocument = (documentId: number) => {
        deleteMutation.mutate(documentId);
    };

    const getIsDocumentDeleting = (documentId: number) =>
        deleteMutation.isPending && deleteMutation.variables === documentId;

    return {
        documents,
        isLoading,
        isError,
        handleDeleteDocument,
        getIsDocumentDeleting,
    };
}

export default useDocumentsPage;
