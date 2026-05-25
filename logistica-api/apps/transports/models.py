from django.db import models


class TransportType(models.TextChoices):
    TRUCK = 'truck', 'Camión'
    VAN = 'van', 'Furgoneta'
    MOTORCYCLE = 'motorcycle', 'Motocicleta'
    BICYCLE = 'bicycle', 'Bicicleta'


class Transport(models.Model):
    name = models.CharField(max_length=255)
    plate_number = models.CharField(max_length=20, unique=True)
    transport_type = models.CharField(max_length=20, choices=TransportType.choices)
    capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transports',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transports'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.plate_number})"
