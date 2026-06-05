import { Link } from 'react-router-dom';

function DocumentsHeader() {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">Documents</h1>
                <p className="page-description">
                    Overview of uploaded documents for translation.
                </p>
            </div>

            <Link to="/documents/upload" className="primary-button">
                Upload new document
            </Link>
        </div>
    );
}

export default DocumentsHeader;
