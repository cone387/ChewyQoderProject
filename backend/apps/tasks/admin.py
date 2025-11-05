from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'project', 'priority', 'status', 'due_date', 'created_at']
    search_fields = ['title', 'description']
    list_filter = ['priority', 'status', 'is_starred', 'created_at']
    date_hierarchy = 'created_at'
