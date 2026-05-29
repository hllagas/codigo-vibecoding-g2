from django.db import models


class Transport(models.Model):

    class VehicleType(models.TextChoices):
        TRUCK = 'TRUCK', 'Truck'
        VAN = 'VAN', 'Van'
        MOTORCYCLE = 'MOTORCYCLE', 'Motorcycle'
        BIKE = 'BIKE', 'Bike'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        IN_ROUTE = 'IN_ROUTE', 'In Route'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        INACTIVE = 'INACTIVE', 'Inactive'

    license_plate = models.CharField(max_length=20, unique=True)
    type = models.CharField(max_length=20, choices=VehicleType.choices)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.SmallIntegerField()
    capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    capacity_m3 = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['license_plate']
        verbose_name = 'transport'
        verbose_name_plural = 'transports'

    def __str__(self):
        return f"{self.license_plate} — {self.brand} {self.model} ({self.year})"
