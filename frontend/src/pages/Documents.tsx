import { Link } from 'react-router-dom';

import DocumentTableRow from '../components/documents/DocumentTableRow';
import type { DocumentItem } from '../types/document';

import './Documents.css';

const documents: DocumentItem[] = [
    {
        id: 1,
        name: 'Contract Agreement.pdf',
        type: 'PDF',
        status: 'Uploaded',
        uploadedAt: '2025-01-12',
    },
    {
        id: 2,
        name: 'Invoice Example.pdf',
        type: 'PDF',
        status: 'Processing',
        uploadedAt: '2025-01-14',
    },
    {
        id: 3,
        name: 'Legal Document.pdf',
        type: 'PDF',
        status: 'Translated',
        uploadedAt: '2025-01-15',
    },
];

function Documents() {
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
                <table className="documents-table">
                    <thead>
                    <tr>
                        <th>Document</th>
                        <th>Type</th>
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
                        />
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Documents;