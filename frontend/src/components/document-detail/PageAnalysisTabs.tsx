import type { PageAnalysisTabsProps } from '../../types/documentDetailComponents';
import {
    getAnalysisLabel,
    getAnalysisStatusLabel,
} from '../../utils/analysis';

function PageAnalysisTabs({
    pageAnalyses,
    activeAnalysisId,
    analysisResult,
    isAiLoadingVisible,
    approvedCount,
    totalBlocksCount,
    allBlocksApproved,
    isSavingAnalysis,
    isDeletingAnalysis,
    onSelectAnalysis,
    onSaveAnalysis,
    onDeleteAnalysis,
}: PageAnalysisTabsProps) {
    if (pageAnalyses.length === 0 && !isAiLoadingVisible) {
        return null;
    }

    return (
        <div className="analysis-version-tabs">
            <div className="analysis-version-tabs-main">
                <div className="analysis-version-tabs-label">
                    Page analyses
                </div>

                <div className="analysis-version-tabs-list">
                    {pageAnalyses.map((analysis) => (
                        <button
                            key={analysis.id}
                            type="button"
                            className={
                                activeAnalysisId === analysis.id
                                    ? 'analysis-version-tab active'
                                    : 'analysis-version-tab'
                            }
                            onClick={() => onSelectAnalysis(analysis.id)}
                        >
                            <span
                                className={
                                    analysis.status === 'saved'
                                        ? 'analysis-version-dot saved'
                                        : 'analysis-version-dot ai'
                                }
                            />

                            <strong>{getAnalysisLabel(analysis)}</strong>

                            <small>
                                {getAnalysisStatusLabel(analysis.status)} · {analysis.blocksCount} blocks
                            </small>
                        </button>
                    ))}

                    {isAiLoadingVisible && (
                        <button
                            type="button"
                            className="analysis-version-tab active loading"
                            disabled
                        >
                            <span className="analysis-version-dot ai" />
                            <strong>Generating...</strong>
                            <small>AI draft</small>
                        </button>
                    )}
                </div>
            </div>

            {analysisResult && !isAiLoadingVisible && (
                <div className="analysis-version-actions">
                    <span>
                        Status: {getAnalysisStatusLabel(analysisResult.analysisStatus)}
                        {' · '}
                        {approvedCount}/{totalBlocksCount} approved
                    </span>

                    <button
                        type="button"
                        className="analysis-version-action-primary"
                        onClick={onSaveAnalysis}
                        disabled={isSavingAnalysis || !allBlocksApproved}
                        title={
                            allBlocksApproved
                                ? 'Save finished analysis'
                                : 'All blocks must be approved first'
                        }
                    >
                        {isSavingAnalysis ? 'Saving...' : 'Save analysis'}
                    </button>

                    <button
                        type="button"
                        className="analysis-version-action-danger"
                        onClick={onDeleteAnalysis}
                        disabled={isDeletingAnalysis}
                    >
                        {isDeletingAnalysis ? 'Deleting...' : 'Delete analysis'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default PageAnalysisTabs;
