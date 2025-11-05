from rest_framework import serializers
from .models import Task
from apps.tags.models import TaskTag


class TaskSerializer(serializers.ModelSerializer):
    subtasks_count = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'user', 'project', 'parent',
            'priority', 'status', 'start_date', 'due_date', 'completed_at', 'order',
            'is_starred', 'is_deleted', 'tags', 'created_at', 'updated_at', 'subtasks_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'completed_at']

    def get_subtasks_count(self, obj):
        return obj.subtasks.count()
    
    def get_tags(self, obj):
        # 返回任务关联的所有标签ID
        return list(obj.task_tags.values_list('tag_id', flat=True))

    def create(self, validated_data):
        # 处理tags字段
        tags_data = self.initial_data.get('tags', [])
        validated_data['user'] = self.context['request'].user
        task = super().create(validated_data)
        
        # 创建任务-标签关联
        if tags_data:
            for tag_id in tags_data:
                TaskTag.objects.create(task=task, tag_id=tag_id)
        
        return task
    
    def update(self, instance, validated_data):
        # 处理tags字段
        tags_data = self.initial_data.get('tags', None)
        task = super().update(instance, validated_data)
        
        # 更新任务-标签关联
        if tags_data is not None:
            # 删除旧的关联
            task.task_tags.all().delete()
            # 创建新的关联
            for tag_id in tags_data:
                TaskTag.objects.create(task=task, tag_id=tag_id)
        
        return task


class TaskDetailSerializer(TaskSerializer):
    subtasks = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['subtasks']

    def get_subtasks(self, obj):
        subtasks = obj.subtasks.all()
        return TaskSerializer(subtasks, many=True).data
