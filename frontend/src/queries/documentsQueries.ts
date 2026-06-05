import { queryOptions } from '@tanstack/react-query';

import {
    getDocumentById,
    getDocuments,
} from '../services/documentsApi';

export const documentsQuery = queryOptions({
    queryKey: ['documents'],
    queryFn: getDocuments,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
});

export function documentDetailQuery(documentId: number) {
    return queryOptions({
        queryKey: ['documents', documentId],
        queryFn: () => getDocumentById(documentId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });
}