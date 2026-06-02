import './UploadDocument.css';

function UploadDocument() {
    return (
        <div>
            <header className="upload-header">
                <h1 className="page-title">Upload document</h1>
            </header>

            <div className="upload-card">
                <form className="upload-form">
                    <div>
                        <label className="form-label" htmlFor="document">
                            PDF document
                        </label>

                        <label className="upload-dropzone" htmlFor="document">
                            <span className="upload-icon">PDF</span>
                            <span className="upload-title">
                                Choose a PDF file
                            </span>
                            <span className="upload-description">
                                Klikni ovde da izabereš dokument sa računara.
                            </span>
                        </label>

                        <input
                            id="document"
                            className="file-input"
                            type="file"
                            accept="application/pdf"
                        />
                    </div>

                    <div className="upload-actions">
                        <button type="submit" className="primary-button">
                            Upload document
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UploadDocument;