from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Task
from .serializers import TaskSerializer, TaskDetailSerializer
from django.utils import timezone
from django.db.models import Count, Q, F
from datetime import timedelta


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'project', 'is_starred']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'order', 'priority']

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        
        # 默认不显示已删除的任务
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(is_deleted=False)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """完成任务"""
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_star(self, request, pk=None):
        """切换标星状态"""
        task = self.get_object()
        task.is_starred = not task.is_starred
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """获取今日任务"""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__date=today,
            status__in=['todo', 'in_progress']
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取任务统计数据"""
        queryset = self.get_queryset()
        now = timezone.now()
        today = now.date()
        
        # 基础统计
        total_count = queryset.count()
        completed_count = queryset.filter(status='completed').count()
        in_progress_count = queryset.filter(status='in_progress').count()
        overdue_count = queryset.filter(
            due_date__lt=now,
            status__in=['todo', 'in_progress']
        ).count()
        
        # 状态分布
        status_distribution = list(queryset.values('status').annotate(
            count=Count('id')
        ))
        
        # 优先级分布
        priority_distribution = list(queryset.values('priority').annotate(
            count=Count('id')
        ))
        
        # 过去7天每日完成数
        weekly_data = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
            day_end = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.max.time()))
            
            completed = queryset.filter(
                completed_at__gte=day_start,
                completed_at__lte=day_end
            ).count()
            
            total = queryset.filter(
                created_at__lte=day_end
            ).count()
            
            weekly_data.append({
                'date': day.isoformat(),
                'completed': completed,
                'total': total
            })
        
        # 项目任务分布
        project_distribution = list(queryset.values(
            'project__id', 'project__name'
        ).annotate(
            count=Count('id')
        ).filter(project__isnull=False))
        
        # 标签使用统计
        from apps.tags.models import TaskTag
        tag_stats = list(TaskTag.objects.filter(
            task__user=request.user
        ).values(
            'tag__id', 'tag__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10])
        
        return Response({
            'summary': {
                'total': total_count,
                'completed': completed_count,
                'in_progress': in_progress_count,
                'overdue': overdue_count,
                'completion_rate': round(completed_count / total_count * 100, 1) if total_count > 0 else 0
            },
            'status_distribution': status_distribution,
            'priority_distribution': priority_distribution,
            'weekly_data': weekly_data,
            'project_distribution': project_distribution,
            'tag_stats': tag_stats
        })
    
    @action(detail=False, methods=['get'])
    def system(self, request):
        """获取系统清单任务"""
        system_type = request.query_params.get('type', 'inbox')
        queryset = Task.objects.filter(user=request.user)
        
        if system_type == 'inbox':
            # 收集箱: 未分配项目且未完成的任务
            queryset = queryset.filter(
                project__isnull=True,
                is_deleted=False
            ).exclude(status='completed')
        elif system_type == 'completed':
            # 已完成: 所有已完成的任务
            queryset = queryset.filter(
                status='completed',
                is_deleted=False
            )
        elif system_type == 'trash':
            # 垃圾筒: 已删除的任务
            queryset = queryset.filter(is_deleted=True)
        else:
            return Response(
                {'error': 'Invalid system type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新任务"""
        task_ids = request.data.get('task_ids', [])
        updates = request.data.get('updates', {})
        
        if not task_ids:
            return Response(
                {'error': 'task_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取当前用户的任务
        tasks = Task.objects.filter(
            id__in=task_ids,
            user=request.user
        )
        
        # 批量更新
        updated_count = tasks.update(**updates)
        
        # 如果是完成操作，更新完成时间
        if updates.get('status') == 'completed':
            tasks.update(completed_at=timezone.now())
        
        # 返回更新后的任务
        updated_tasks = Task.objects.filter(
            id__in=task_ids,
            user=request.user
        )
        serializer = self.get_serializer(updated_tasks, many=True)
        
        return Response({
            'updated_count': updated_count,
            'tasks': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """软删除任务（移入垃圾筒）"""
        task = self.get_object()
        task.is_deleted = True
        task.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """恢复已删除的任务"""
        task = self.get_object()
        task.is_deleted = False
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        """永久删除任务"""
        task = self.get_object()
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
