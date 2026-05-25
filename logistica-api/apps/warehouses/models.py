from django.db import models


class Warehouse(models.Model):
    # Nombre del almacén
    name = models.CharField(max_length=255, null=False)
    # Dirección física del almacén — requerida
    address = models.TextField(null=False)
    # Ciudad donde se ubica el almacén — requerido
    city = models.CharField(max_length=100, null=False)
    # País donde se ubica el almacén — requerido
    country = models.CharField(max_length=100, null=False)
    # Coordenadas geográficas opcionales para geolocalización
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # Capacidad máxima en unidades — requerida
    capacity = models.IntegerField(null=False)
    # Estado activo/inactivo del almacén
    is_active = models.BooleanField(default=True)
    # Fechas de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouses'
        ordering = ['name']

    def __str__(self):
        return self.name


class WarehouseStock(models.Model):
    # Almacén al que pertenece este registro de stock
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
    )
    # Producto en stock — referencia por string para evitar importación circular entre apps
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
    )
    # Cantidad de unidades disponibles en el almacén
    quantity = models.IntegerField(default=0, null=False)
    # Fecha de última actualización del stock
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouse_stock'
        # Un producto no puede aparecer dos veces en el mismo almacén
        unique_together = [('warehouse', 'product')]

    def __str__(self):
        return f'{self.warehouse} — {self.product} ({self.quantity})'
