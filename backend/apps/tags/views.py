from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Tag, TaskTag
from .serializers import TagSerializer, TaskTagSerializer


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        创建标签，如果标签名已存在则返回已存在的标签
        """
        name = request.data.get('name')
        if name:
            # 检查是否已存在同名标签
            existing_tag = Tag.objects.filter(user=request.user, name=name).first()
            if existing_tag:
                # 更新颜色（如果提供了新颜色）
                if 'color' in request.data:
                    existing_tag.color = request.data['color']
                    existing_tag.save()
                serializer = self.get_serializer(existing_tag)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        # 如果不存在，正常创建
        return super().create(request, *args, **kwargs)


class TaskTagViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTagSerializer

    def get_queryset(self):
        return TaskTag.objects.filter(tag__user=self.request.user)
