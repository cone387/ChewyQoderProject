from rest_framework import viewsets
from .models import Tag, TaskTag
from .serializers import TagSerializer, TaskTagSerializer


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskTagViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTagSerializer

    def get_queryset(self):
        return TaskTag.objects.filter(tag__user=self.request.user)
