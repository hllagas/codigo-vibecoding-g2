from django.db import models


class Route(models.Model):
    name = models.CharField(max_length=200)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='routes',
    )
    estimated_duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'route'
        verbose_name_plural = 'routes'

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(
        'Route',
        on_delete=models.CASCADE,
        related_name='stops',
    )
    order = models.SmallIntegerField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        ordering = ['route', 'order']
        verbose_name = 'route stop'
        verbose_name_plural = 'route stops'
        unique_together = [['route', 'order']]

    def __str__(self):
        return f"Stop {self.order} — {self.city} ({self.route.name})"
