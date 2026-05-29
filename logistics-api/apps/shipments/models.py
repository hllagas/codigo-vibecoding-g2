import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Shipment(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
        RETURNED = 'RETURNED', 'Returned'

    tracking_number = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='shipments_origin',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    transport = models.ForeignKey(
        'transports.Transport',
        on_delete=models.PROTECT,
        related_name='shipments',
        null=True,
        blank=True,
    )
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.PROTECT,
        related_name='shipments',
        null=True,
        blank=True,
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.PROTECT,
        related_name='shipments',
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=8, decimal_places=3, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            prefix = uuid.uuid4().hex[:8].upper()
            timestamp = timezone.now().strftime('%Y%m%d')
            self.tracking_number = f"LOG-{prefix}-{timestamp}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tracking_number} — {self.get_status_display()}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'shipment'
        verbose_name_plural = 'shipments'


class ShipmentProduct(models.Model):
    shipment = models.ForeignKey(
        'Shipment',
        on_delete=models.CASCADE,
        related_name='shipment_products',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='shipment_products',
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = [['shipment', 'product']]
        verbose_name = 'shipment product'
        verbose_name_plural = 'shipment products'

    def __str__(self):
        return f"{self.product.sku} x{self.quantity} — Envio {self.shipment.tracking_number}"
