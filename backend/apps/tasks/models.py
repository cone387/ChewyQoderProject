from django.db import models
from django.conf import settings


class Task(models.Model):
    """
    任务模型
    """
    PRIORITY_CHOICES = [
        ('none', '无'),
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
    ]
    
    STATUS_CHOICES = [
        ('todo', '待办'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
    ]

    title = models.CharField(max_length=255, verbose_name='标题')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='所属用户'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name='所属项目'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subtasks',
        verbose_name='父任务'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='none',
        verbose_name='优先级'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='todo',
        verbose_name='状态'
    )
    start_date = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='截止时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    order = models.IntegerField(default=0, verbose_name='排序')
    is_starred = models.BooleanField(default=False, verbose_name='是否标星')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'tasks'
        verbose_name = '任务'
        verbose_name_plural = verbose_name
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title
