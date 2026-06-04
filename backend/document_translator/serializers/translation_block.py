from rest_framework import serializers

from document_translator.models import TranslationBlock


class TranslationBlockSerializer(serializers.ModelSerializer):
    documentId = serializers.IntegerField(source="document_id", read_only=True)
    pageId = serializers.IntegerField(source="page_id", read_only=True)

    bbox = serializers.SerializerMethodField()

    class Meta:
        model = TranslationBlock
        fields = [
            "id",
            "documentId",
            "pageId",
            "block_type",
            "source",
            "source_text",
            "translated_text",
            "bbox_x",
            "bbox_y",
            "bbox_width",
            "bbox_height",
            "bbox",
            "confidence",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "documentId",
            "pageId",
            "created_at",
            "updated_at",
        ]

    def get_bbox(self, obj):
        return {
            "x": obj.bbox_x,
            "y": obj.bbox_y,
            "width": obj.bbox_width,
            "height": obj.bbox_height,
        }
