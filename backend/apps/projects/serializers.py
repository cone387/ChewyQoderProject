from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    uncompleted_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'user',
            'is_favorite', 'is_pinned', 'order', 'created_at', 'updated_at', 
            'tasks_count', 'uncompleted_count', 'completed_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        return obj.tasks.filter(is_deleted=False).count()
    
    def get_uncompleted_count(self, obj):
        return obj.tasks.filter(is_deleted=False).exclude(status='completed').count()
    
    def get_completed_count(self, obj):
        return obj.tasks.filter(is_deleted=False, status='completed').count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
