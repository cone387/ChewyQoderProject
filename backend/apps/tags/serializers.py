from rest_framework import serializers
from .models import Tag, TaskTag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'user', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskTagSerializer(serializers.ModelSerializer):
    tag_detail = TagSerializer(source='tag', read_only=True)
    
    class Meta:
        model = TaskTag
        fields = ['id', 'task', 'tag', 'tag_detail', 'created_at']
        read_only_fields = ['id', 'created_at']
