from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, TaskTagViewSet

router = DefaultRouter()
router.register(r'', TagViewSet, basename='tag')
router.register(r'task-tags', TaskTagViewSet, basename='task-tag')

urlpatterns = [
    path('', include(router.urls)),
]
