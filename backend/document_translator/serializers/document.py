from rest_framework import serializers

from document_translator.models import Document, DocumentPage


class DocumentPageSerializer(serializers.ModelSerializer):
    pageNumber = serializers.IntegerField(source="page_number", read_only=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = DocumentPage
        fields = [
            "id",
            "pageNumber",
            "imageUrl",
            "width",
            "height",
            "created_at",
        ]

    def get_imageUrl(self, obj):
        request = self.context.get("request")

        if not obj.image:
            return None

        if request is None:
            return obj.image.url

        return request.build_absolute_uri(obj.image.url)


class DocumentListSerializer(serializers.ModelSerializer):
    sourceLanguage = serializers.CharField(source="source_language", read_only=True)
    targetLanguage = serializers.CharField(source="target_language", read_only=True)
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)
    pageCount = serializers.IntegerField(source="page_count", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "name",
            "status",
            "sourceLanguage",
            "targetLanguage",
            "uploadedAt",
            "pageCount",
        ]


class DocumentDetailSerializer(DocumentListSerializer):
    pages = DocumentPageSerializer(many=True, read_only=True)

    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + [
            "pages",
            "error_message",
        ]