from django.db import models


class RouteStatus(models.TextChoices):
    PLANNED = 'planned', 'Planificada'
    IN_PROGRESS = 'in_progress', 'En progreso'
    COMPLETED = 'completed', 'Completada'
    CANCELLED = 'cancelled', 'Cancelada'


class Route(models.Model):
    name = models.CharField(max_length=255)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='routes',
    )
    transport = models.ForeignKey(
        'transports.Transport',
        on_delete=models.PROTECT,
        related_name='routes',
    )
    status = models.CharField(
        max_length=20,
        choices=RouteStatus.choices,
        default=RouteStatus.PLANNED,
    )
    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} [{self.status}]"


class RouteStop(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops',
    )
    stop_order = models.IntegerField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    actual_arrival = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'route_stops'
        ordering = ['stop_order']
        unique_together = [('route', 'stop_order')]
