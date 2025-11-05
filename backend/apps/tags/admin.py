from django.contrib import admin
from .models import Tag, TaskTag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'user', 'created_at']
    search_fields = ['name']
    list_filter = ['created_at']


@admin.register(TaskTag)
class TaskTagAdmin(admin.ModelAdmin):
    list_display = ['task', 'tag', 'created_at']
    list_filter = ['created_at']
