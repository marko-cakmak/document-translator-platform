from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPage


@api_view(["POST"])
def analyze_document_page(request, document_id, page_id):
    try:
        page = DocumentPage.objects.select_related("document").get(
            id=page_id,
            document_id=document_id,
        )
    except DocumentPage.DoesNotExist:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    target_language = request.data.get("targetLanguage") or page.document.target_language or "sr"

    source_blocks = [
        {
            "clientId": "source_1",
            "blockType": "title",
            "sourceText": "Sport und Sprache",
            "sourceBox": {
                "x": 80,
                "y": 120,
                "width": 520,
                "height": 60,
            },
            "confidence": 0.96,
        },
        {
            "clientId": "source_2",
            "blockType": "paragraph",
            "sourceText": "Sport und Sprache - darüber gab es bislang wenig Aufregendes zu sagen.",
            "sourceBox": {
                "x": 80,
                "y": 210,
                "width": 720,
                "height": 130,
            },
            "confidence": 0.91,
        },
        {
            "clientId": "source_3",
            "blockType": "paragraph",
            "sourceText": "Dieser Textblock ist ein Beispiel für die spätere KI-Analyse.",
            "sourceBox": {
                "x": 80,
                "y": 380,
                "width": 700,
                "height": 120,
            },
            "confidence": 0.89,
        },
    ]

    translation_blocks = [
        {
            "clientId": "target_1",
            "sourceClientId": "source_1",
            "targetLanguage": target_language,
            "translatedText": "Sport i jezik",
            "targetBox": {
                "x": 80,
                "y": 120,
                "width": 520,
                "height": 70,
            },
            "html": "<h2>Sport i jezik</h2>",
            "css": {
                "fontSize": "22px",
                "fontWeight": "700",
                "lineHeight": "1.25",
                "textAlign": "left",
            },
        },
        {
            "clientId": "target_2",
            "sourceClientId": "source_2",
            "targetLanguage": target_language,
            "translatedText": "Sport i jezik - o tome se do sada nije imalo mnogo uzbudljivog reći.",
            "targetBox": {
                "x": 80,
                "y": 210,
                "width": 720,
                "height": 150,
            },
            "html": "<p>Sport i jezik - o tome se do sada nije imalo mnogo uzbudljivog reći.</p>",
            "css": {
                "fontSize": "14px",
                "fontWeight": "400",
                "lineHeight": "1.5",
                "textAlign": "left",
            },
        },
        {
            "clientId": "target_3",
            "sourceClientId": "source_3",
            "targetLanguage": target_language,
            "translatedText": "Ovaj tekstualni blok je primer za kasniju AI analizu.",
            "targetBox": {
                "x": 80,
                "y": 380,
                "width": 700,
                "height": 140,
            },
            "html": "<p>Ovaj tekstualni blok je primer za kasniju AI analizu.</p>",
            "css": {
                "fontSize": "14px",
                "fontWeight": "400",
                "lineHeight": "1.5",
                "textAlign": "left",
            },
        },
    ]

    return Response(
        {
            "documentId": page.document_id,
            "pageId": page.id,
            "pageNumber": page.page_number,
            "imageWidth": page.width,
            "imageHeight": page.height,
            "sourceBlocks": source_blocks,
            "translationBlocks": translation_blocks,
        }
    )
