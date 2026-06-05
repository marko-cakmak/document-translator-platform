type AnalysisLoadingOverlayProps = {
    isAiLoadingVisible: boolean;
    isFetchingActiveAnalysis: boolean;
};

function AnalysisLoadingOverlay({
    isAiLoadingVisible,
    isFetchingActiveAnalysis,
}: AnalysisLoadingOverlayProps) {
    if (!isAiLoadingVisible && !isFetchingActiveAnalysis) {
        return null;
    }

    return (
        <div className="ai-analysis-loading">
            <div className="ai-analysis-loading-card">
                <div className="ai-analysis-spinner" />

                <strong>
                    {isAiLoadingVisible
                        ? 'AI analysis is running'
                        : 'Loading analysis'}
                </strong>

                <span>
                    {isAiLoadingVisible
                        ? 'Analyzing document text and layout...'
                        : 'Loading selected page analysis...'}
                </span>
            </div>
        </div>
    );
}

export default AnalysisLoadingOverlay;
