from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_favorite', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['is_favorite', 'created_at']
