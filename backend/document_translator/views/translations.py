from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def translate_document(request, document_id):
    source_text = request.data.get("text", "")
    target_language = request.data.get("targetLanguage", "sr")

    if not source_text:
        return Response(
            {"detail": "Text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "documentId": document_id,
            "sourceText": source_text,
            "translatedText": f"[Mock {target_language} translation] {source_text}",
            "targetLanguage": target_language,
        }
    )