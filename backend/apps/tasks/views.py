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
        return Task.objects.filter(user=self.request.user)

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
