from document_translator.models import (
    DocumentBlockTranslation,
    DocumentPageAnalysis,
)


class PageAnalysisWorkflowError(Exception):
    def __init__(self, detail, status_code=400, extra=None):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
        self.extra = extra or {}


def save_analysis_if_all_blocks_approved(*, document_id, page, analysis):
    translations = DocumentBlockTranslation.objects.filter(
        block__document_id=document_id,
        block__page=page,
        block__analysis=analysis,
    )

    total_count = translations.count()
    approved_count = translations.filter(
        status=DocumentBlockTranslation.Status.APPROVED,
    ).count()

    if total_count == 0:
        raise PageAnalysisWorkflowError(
            "Analysis has no blocks to approve.",
            status_code=400,
        )

    if approved_count != total_count:
        raise PageAnalysisWorkflowError(
            "All blocks must be approved before saving analysis.",
            status_code=400,
            extra={
                "approvedCount": approved_count,
                "totalCount": total_count,
            },
        )

    analysis.status = DocumentPageAnalysis.Status.SAVED
    analysis.save(update_fields=["status", "updated_at"])

    return analysis


def approve_translation_for_analysis(
    *,
    document_id,
    page,
    analysis,
    translation_id,
):
    try:
        translation = DocumentBlockTranslation.objects.select_related(
            "block",
        ).get(
            id=translation_id,
            block__document_id=document_id,
            block__page=page,
            block__analysis=analysis,
        )
    except DocumentBlockTranslation.DoesNotExist:
        raise PageAnalysisWorkflowError(
            "Translation block not found.",
            status_code=404,
        )

    translation.status = DocumentBlockTranslation.Status.APPROVED
    translation.save(update_fields=["status", "updated_at"])

    if analysis.status == DocumentPageAnalysis.Status.SAVED:
        analysis.status = DocumentPageAnalysis.Status.DRAFT
        analysis.save(update_fields=["status", "updated_at"])

    return translation


def delete_analysis(analysis):
    analysis.delete()
