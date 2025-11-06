from django.db import models
from django.conf import settings


class Tag(models.Model):
    """
    标签模型
    """
    name = models.CharField(max_length=50, verbose_name='标签名称')
    color = models.CharField(max_length=7, default='#10B981', verbose_name='颜色')
    order = models.IntegerField(default=0, verbose_name='排序')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags',
        verbose_name='所属用户'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'tags'
        verbose_name = '标签'
        verbose_name_plural = verbose_name
        unique_together = ['name', 'user']
        ordering = ['order', 'id']

    def __str__(self):
        return self.name


class TaskTag(models.Model):
    """
    任务-标签关联模型
    """
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='task_tags',
        verbose_name='任务'
    )
    tag = models.ForeignKey(
        Tag,
        on_delete=models.CASCADE,
        related_name='task_tags',
        verbose_name='标签'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'task_tags'
        verbose_name = '任务标签'
        verbose_name_plural = verbose_name
        unique_together = ['task', 'tag']

    def __str__(self):
        return f'{self.task.title} - {self.tag.name}'
