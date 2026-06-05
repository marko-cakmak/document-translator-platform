import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { uploadDocument } from '../../services/documentsApi';
import type { DocumentDetailItem } from '../../types/document';

import './UploadDocument.css';

function UploadDocument() {
    const queryClient = useQueryClient();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sourceLanguage, setSourceLanguage] = useState('de');
    const [targetLanguage, setTargetLanguage] = useState('sr');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedDocument, setUploadedDocument] =
        useState<DocumentDetailItem | null>(null);

    const uploadMutation = useMutation({
        mutationFn: uploadDocument,
        onSuccess: async (document) => {
            setUploadProgress(100);
            setUploadedDocument(document);

            await queryClient.invalidateQueries({
                queryKey: ['documents'],
            });
        },
        onError: (error) => {
            console.error('Upload failed:', error);
            setUploadProgress(0);
            setErrorMessage('Upload nije uspeo. Proveri da li je fajl validan PDF.');
        },
    });

    useEffect(() => {
        if (!uploadMutation.isPending) {
            return;
        }

        setUploadProgress(8);

        const intervalId = window.setInterval(() => {
            setUploadProgress((currentProgress) => {
                if (currentProgress >= 92) {
                    return currentProgress;
                }

                return currentProgress + Math.random() * 8;
            });
        }, 350);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [uploadMutation.isPending]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        setErrorMessage(null);
        setUploadedDocument(null);
        setUploadProgress(0);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (file.type !== 'application/pdf') {
            setSelectedFile(null);
            setErrorMessage('Dozvoljen je samo PDF fajl.');
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setErrorMessage(null);
        setUploadedDocument(null);
        setUploadProgress(0);

        if (!selectedFile) {
            setErrorMessage('Izaberi PDF dokument pre upload-a.');
            return;
        }

        uploadMutation.mutate({
            file: selectedFile,
            sourceLanguage,
            targetLanguage,
        });
    };

    const handleUploadAnother = () => {
        setSelectedFile(null);
        setUploadedDocument(null);
        setUploadProgress(0);
        setErrorMessage(null);
    };

    const isProcessing = uploadMutation.isPending;
    const showProgress = isProcessing || uploadProgress === 100;

    return (
        <div>
            <header className="upload-header">
                <h1 className="page-title">Upload document</h1>
                <p className="page-description">
                    Uploaduj PDF dokument. Backend će sačuvati originalni fajl i pretvoriti stranice u slike.
                </p>
            </header>

            <div className="upload-card">
                <form className="upload-form" onSubmit={handleSubmit}>
                    <div>
                        <label
                            className={`upload-dropzone ${selectedFile ? 'upload-dropzone-selected' : ''}`}
                            htmlFor="document"
                        >
                            <span className="upload-icon">PDF</span>
                            <span className="upload-title">
                                {selectedFile ? selectedFile.name : 'Choose a PDF file'}
                            </span>
                            <span className="upload-description">
                                {selectedFile
                                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                    : 'Klikni ovde da izabereš dokument sa računara.'}
                            </span>
                        </label>

                        <input
                            id="document"
                            className="file-input"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                    </div>

                    <div className="upload-grid">
                        <div>
                            <label className="form-label" htmlFor="sourceLanguage">
                                Source language
                            </label>
                            <select
                                id="sourceLanguage"
                                className="form-select"
                                value={sourceLanguage}
                                onChange={(event) => setSourceLanguage(event.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="de">German</option>
                                <option value="en">English</option>
                                <option value="sr">Serbian</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label" htmlFor="targetLanguage">
                                Target language
                            </label>
                            <select
                                id="targetLanguage"
                                className="form-select"
                                value={targetLanguage}
                                onChange={(event) => setTargetLanguage(event.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="sr">Serbian</option>
                                <option value="en">English</option>
                                <option value="de">German</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                    </div>

                    {showProgress && (
                        <div className="upload-progress-card">
                            <div className="upload-progress-header">
                                <span>
                                    {isProcessing ? 'Processing PDF...' : 'Processing completed'}
                                </span>
                                <strong>{Math.round(uploadProgress)}%</strong>
                            </div>

                            <div className="upload-progress-track">
                                <div
                                    className="upload-progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>

                            <p className="upload-progress-description">
                                {isProcessing
                                    ? 'Backend čuva originalni PDF i generiše slike za svaku stranicu.'
                                    : 'Dokument je uspešno obrađen.'}
                            </p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="upload-error">
                            {errorMessage}
                        </div>
                    )}

                    {uploadedDocument && (
                        <div className="upload-result-card">
                            <div>
                                <span className="upload-result-label">
                                    Upload completed
                                </span>
                                <h2>{uploadedDocument.name}</h2>
                            </div>

                            <div className="upload-result-grid">
                                <div>
                                    <span>Status</span>
                                    <strong>{uploadedDocument.status}</strong>
                                </div>

                                <div>
                                    <span>Pages</span>
                                    <strong>{uploadedDocument.pageCount ?? 0}</strong>
                                </div>

                                <div>
                                    <span>Source</span>
                                    <strong>{uploadedDocument.sourceLanguage || '—'}</strong>
                                </div>

                                <div>
                                    <span>Target</span>
                                    <strong>{uploadedDocument.targetLanguage || '—'}</strong>
                                </div>
                            </div>

                            <div className="upload-result-actions">
                                <Link
                                    to={`/documents/${uploadedDocument.id}`}
                                    className="primary-button"
                                >
                                    Open document
                                </Link>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={handleUploadAnother}
                                >
                                    Upload another
                                </button>
                            </div>
                        </div>
                    )}

                    {!uploadedDocument && (
                        <div className="upload-actions">
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processing PDF...' : 'Upload document'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default UploadDocument;