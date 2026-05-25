from django.db import models


class ShipmentStatus(models.TextChoices):
    PENDING = 'pending', 'Pendiente'
    PROCESSING = 'processing', 'En procesamiento'
    IN_TRANSIT = 'in_transit', 'En tránsito'
    DELIVERED = 'delivered', 'Entregado'
    CANCELLED = 'cancelled', 'Cancelado'
    RETURNED = 'returned', 'Devuelto'


VALID_TRANSITIONS = {
    'pending': ['processing', 'cancelled'],
    'processing': ['in_transit', 'cancelled'],
    'in_transit': ['delivered', 'returned'],
    'delivered': [],
    'cancelled': [],
    'returned': [],
}


class Shipment(models.Model):
    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PENDING,
    )
    scheduled_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tracking_number} [{self.status}]"


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='shipment_items',
    )
    quantity = models.IntegerField()
    unit_price_at_shipment = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'shipment_items'
        unique_together = [('shipment', 'product')]
