from document_translator.models import (
    DocumentBlock,
    DocumentBlockTranslation,
    DocumentPage,
    DocumentPageAnalysis,
)


def get_int_from_box(box, key, default=0):
    try:
        return int(round(float(box.get(key, default))))
    except (TypeError, ValueError):
        return default


def get_page_or_none(document_id, page_id):
    try:
        return DocumentPage.objects.select_related("document").get(
            id=page_id,
            document_id=document_id,
        )
    except DocumentPage.DoesNotExist:
        return None


def get_analysis_or_none(document_id, page, analysis_id):
    try:
        return DocumentPageAnalysis.objects.get(
            id=analysis_id,
            document_id=document_id,
            page=page,
        )
    except DocumentPageAnalysis.DoesNotExist:
        return None


def get_next_ai_analysis_name(document_id, page):
    current_ai_count = DocumentPageAnalysis.objects.filter(
        document_id=document_id,
        page=page,
        source=DocumentPageAnalysis.Source.AI,
    ).count()

    return f"AI analysis {current_ai_count + 1}"


def serialize_analysis_summary(analysis):
    return {
        "id": analysis.id,
        "name": analysis.name,
        "source": analysis.source,
        "status": analysis.status,
        "createdAt": analysis.created_at.isoformat(),
        "updatedAt": analysis.updated_at.isoformat(),
        "blocksCount": analysis.blocks.count(),
    }


def serialize_source_block(block):
    return {
        "id": block.id,
        "analysisId": block.analysis_id,
        "clientId": block.client_id or f"source_saved_{block.id}",
        "blockType": block.block_type,
        "sourceText": block.source_text,
        "sourceBox": {
            "x": block.bbox_x,
            "y": block.bbox_y,
            "width": block.bbox_width,
            "height": block.bbox_height,
        },
        "confidence": block.confidence,
        "saved": True,
    }


def serialize_translation_block(translation):
    source_client_id = (
        translation.block.client_id
        or f"source_saved_{translation.block_id}"
    )

    return {
        "id": translation.id,
        "analysisId": translation.block.analysis_id,
        "clientId": translation.client_id or f"target_saved_{translation.id}",
        "sourceClientId": source_client_id,
        "targetLanguage": translation.target_language,
        "translatedText": translation.translated_text,
        "targetBox": {
            "x": translation.target_x,
            "y": translation.target_y,
            "width": translation.target_width,
            "height": translation.target_height,
        },
        "html": translation.html,
        "css": translation.css or {},
        "status": translation.status,
        "saved": True,
    }


def serialize_analysis_result(document_id, page, analysis):
    blocks = (
        DocumentBlock.objects
        .filter(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
        .prefetch_related("translations")
        .order_by("bbox_y", "bbox_x")
    )

    source_blocks = []
    translation_blocks = []

    for block in blocks:
        source_blocks.append(serialize_source_block(block))

        translation = block.translations.order_by("-updated_at").first()

        if translation:
            translation_blocks.append(
                serialize_translation_block(translation)
            )

    return {
        "documentId": document_id,
        "pageId": page.id,
        "pageNumber": page.page_number,
        "analysisId": analysis.id,
        "analysisName": analysis.name,
        "analysisSource": analysis.source,
        "analysisStatus": analysis.status,
        "imageWidth": page.width,
        "imageHeight": page.height,
        "sourceBlocks": source_blocks,
        "translationBlocks": translation_blocks,
    }


def serialize_empty_analysis_result(document_id, page):
    return {
        "documentId": document_id,
        "pageId": page.id,
        "pageNumber": page.page_number,
        "analysisId": None,
        "analysisName": None,
        "analysisSource": None,
        "analysisStatus": None,
        "imageWidth": page.width,
        "imageHeight": page.height,
        "sourceBlocks": [],
        "translationBlocks": [],
    }


def create_block_for_analysis(document_id, page, analysis, source_block):
    source_box = source_block.get("sourceBox", {})

    return DocumentBlock.objects.create(
        document_id=document_id,
        page=page,
        analysis=analysis,
        client_id=source_block.get("clientId", ""),
        block_type=source_block.get(
            "blockType",
            DocumentBlock.BlockType.UNKNOWN,
        ),
        source=DocumentBlock.Source.AI,
        source_text=source_block.get("sourceText", ""),
        bbox_x=get_int_from_box(source_box, "x"),
        bbox_y=get_int_from_box(source_box, "y"),
        bbox_width=get_int_from_box(source_box, "width"),
        bbox_height=get_int_from_box(source_box, "height"),
        confidence=source_block.get("confidence"),
    )


def create_translation_for_block(block, translation_block):
    target_box = translation_block.get("targetBox", {})

    return DocumentBlockTranslation.objects.create(
        block=block,
        client_id=translation_block.get("clientId", ""),
        target_language=translation_block.get("targetLanguage", ""),
        translated_text=translation_block.get("translatedText", ""),
        target_x=get_int_from_box(target_box, "x"),
        target_y=get_int_from_box(target_box, "y"),
        target_width=get_int_from_box(target_box, "width"),
        target_height=get_int_from_box(target_box, "height"),
        html=translation_block.get("html", ""),
        css=translation_block.get("css", {}),
        status=DocumentBlockTranslation.Status.DRAFT,
    )


def get_or_create_block(document_id, page, analysis, source_block):
    client_id = source_block.get("clientId", "")
    source_box = source_block.get("sourceBox", {})

    existing_block = None

    if client_id:
        existing_block = DocumentBlock.objects.filter(
            document_id=document_id,
            page=page,
            analysis=analysis,
            client_id=client_id,
        ).first()

    block_data = {
        "document_id": document_id,
        "page": page,
        "analysis": analysis,
        "client_id": client_id,
        "block_type": source_block.get(
            "blockType",
            DocumentBlock.BlockType.UNKNOWN,
        ),
        "source": DocumentBlock.Source.AI,
        "source_text": source_block.get("sourceText", ""),
        "bbox_x": get_int_from_box(source_box, "x"),
        "bbox_y": get_int_from_box(source_box, "y"),
        "bbox_width": get_int_from_box(source_box, "width"),
        "bbox_height": get_int_from_box(source_box, "height"),
        "confidence": source_block.get("confidence"),
    }

    if existing_block:
        for field, value in block_data.items():
            setattr(existing_block, field, value)

        existing_block.save()
        return existing_block

    return DocumentBlock.objects.create(**block_data)


def get_or_create_translation(block, translation_block):
    client_id = translation_block.get("clientId", "")
    target_box = translation_block.get("targetBox", {})

    existing_translation = None

    if client_id:
        existing_translation = DocumentBlockTranslation.objects.filter(
            block=block,
            client_id=client_id,
        ).first()

    translation_data = {
        "block": block,
        "client_id": client_id,
        "target_language": translation_block.get("targetLanguage", ""),
        "translated_text": translation_block.get("translatedText", ""),
        "target_x": get_int_from_box(target_box, "x"),
        "target_y": get_int_from_box(target_box, "y"),
        "target_width": get_int_from_box(target_box, "width"),
        "target_height": get_int_from_box(target_box, "height"),
        "html": translation_block.get("html", ""),
        "css": translation_block.get("css", {}),
        "status": DocumentBlockTranslation.Status.DRAFT,
    }

    if existing_translation:
        for field, value in translation_data.items():
            setattr(existing_translation, field, value)

        existing_translation.save()
        return existing_translation

    return DocumentBlockTranslation.objects.create(**translation_data)
