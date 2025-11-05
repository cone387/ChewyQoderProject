from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.filter(user=self.request.user)
        
        # 支持按is_pinned筛选
        is_pinned = self.request.query_params.get('is_pinned')
        if is_pinned is not None:
            queryset = queryset.filter(is_pinned=is_pinned.lower() == 'true')
        
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """切换收藏状态"""
        project = self.get_object()
        project.is_favorite = not project.is_favorite
        project.save()
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """切换置顶状态"""
        project = self.get_object()
        project.is_pinned = not project.is_pinned
        project.save()
        serializer = self.get_serializer(project)
        return Response(serializer.data)
