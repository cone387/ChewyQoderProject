from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    subtasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'user', 'project', 'parent',
            'priority', 'status', 'due_date', 'completed_at', 'order',
            'is_starred', 'created_at', 'updated_at', 'subtasks_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'completed_at']

    def get_subtasks_count(self, obj):
        return obj.subtasks.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskDetailSerializer(TaskSerializer):
    subtasks = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['subtasks']

    def get_subtasks(self, obj):
        subtasks = obj.subtasks.all()
        return TaskSerializer(subtasks, many=True).data
