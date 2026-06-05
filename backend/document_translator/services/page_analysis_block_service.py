from django.db import transaction

from document_translator.services.page_analysis_service import (
    get_analysis_or_none,
    get_int_from_box,
    get_or_create_block,
    get_or_create_translation,
)


class PageAnalysisBlockError(Exception):
    def __init__(self, detail, status_code=400):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def get_analysis_id_from_block_payload(
    *,
    request_data,
    source_block,
    translation_block,
):
    return (
        source_block.get("analysisId")
        or translation_block.get("analysisId")
        or request_data.get("analysisId")
    )


def validate_block_payload(*, source_block, translation_block):
    if not source_block or not translation_block:
        raise PageAnalysisBlockError(
            "sourceBlock and translationBlock are required.",
            status_code=400,
        )

    if source_block.get("clientId") != translation_block.get("sourceClientId"):
        raise PageAnalysisBlockError(
            "sourceBlock.clientId must match translationBlock.sourceClientId.",
            status_code=400,
        )

    source_box = source_block.get("sourceBox", {})
    target_box = translation_block.get("targetBox", {})

    if (
        get_int_from_box(source_box, "width") <= 0
        or get_int_from_box(source_box, "height") <= 0
    ):
        raise PageAnalysisBlockError(
            "Source block width and height must be greater than zero.",
            status_code=400,
        )

    if (
        get_int_from_box(target_box, "width") <= 0
        or get_int_from_box(target_box, "height") <= 0
    ):
        raise PageAnalysisBlockError(
            "Translation block width and height must be greater than zero.",
            status_code=400,
        )


def save_analysis_block_from_payload(*, document_id, page, request_data):
    source_block = request_data.get("sourceBlock")
    translation_block = request_data.get("translationBlock")

    validate_block_payload(
        source_block=source_block,
        translation_block=translation_block,
    )

    analysis_id = get_analysis_id_from_block_payload(
        request_data=request_data,
        source_block=source_block,
        translation_block=translation_block,
    )

    if not analysis_id:
        raise PageAnalysisBlockError(
            "analysisId is required.",
            status_code=400,
        )

    analysis = get_analysis_or_none(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        raise PageAnalysisBlockError(
            "Document page analysis not found.",
            status_code=404,
        )

    with transaction.atomic():
        block = get_or_create_block(
            document_id=document_id,
            page=page,
            analysis=analysis,
            source_block=source_block,
        )
        translation = get_or_create_translation(
            block=block,
            translation_block=translation_block,
        )

    return {
        "documentId": document_id,
        "pageId": page.id,
        "analysisId": analysis.id,
        "analysisName": analysis.name,
        "analysisStatus": analysis.status,
        "sourceBlockId": block.id,
        "translationBlockId": translation.id,
        "sourceClientId": block.client_id,
        "translationClientId": translation.client_id,
        "status": "saved",
    }
