from rest_framework import serializers

from document_translator.models import DocumentBlock, DocumentBlockTranslation


class DocumentBlockTranslationSerializer(serializers.ModelSerializer):
    targetBox = serializers.SerializerMethodField()
    sourceBlockId = serializers.IntegerField(source="block_id", read_only=True)

    class Meta:
        model = DocumentBlockTranslation
        fields = [
            "id",
            "client_id",
            "sourceBlockId",
            "target_language",
            "translated_text",
            "target_x",
            "target_y",
            "target_width",
            "target_height",
            "targetBox",
            "html",
            "css",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_targetBox(self, obj):
        return {
            "x": obj.target_x,
            "y": obj.target_y,
            "width": obj.target_width,
            "height": obj.target_height,
        }


class DocumentBlockSerializer(serializers.ModelSerializer):
    documentId = serializers.IntegerField(source="document_id", read_only=True)
    pageId = serializers.IntegerField(source="page_id", read_only=True)
    sourceBox = serializers.SerializerMethodField()
    translations = DocumentBlockTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = DocumentBlock
        fields = [
            "id",
            "client_id",
            "documentId",
            "pageId",
            "block_type",
            "source",
            "source_text",
            "bbox_x",
            "bbox_y",
            "bbox_width",
            "bbox_height",
            "sourceBox",
            "confidence",
            "translations",
            "created_at",
            "updated_at",
        ]

    def get_sourceBox(self, obj):
        return {
            "x": obj.bbox_x,
            "y": obj.bbox_y,
            "width": obj.bbox_width,
            "height": obj.bbox_height,
        }
