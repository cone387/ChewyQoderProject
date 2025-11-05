from django.db import models
from django.conf import settings


class Project(models.Model):
    """
    项目模型
    """
    name = models.CharField(max_length=255, verbose_name='项目名称')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    color = models.CharField(max_length=7, default='#3B82F6', verbose_name='颜色')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        verbose_name='所属用户'
    )
    is_favorite = models.BooleanField(default=False, verbose_name='是否收藏')
    is_pinned = models.BooleanField(default=False, verbose_name='是否置顶')
    order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'projects'
        verbose_name = '项目'
        verbose_name_plural = verbose_name
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.name
