from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'user',
            'is_favorite', 'order', 'created_at', 'updated_at', 'tasks_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
