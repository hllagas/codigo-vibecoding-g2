from django.conf import settings
from django.db import models


class Driver(models.Model):

    class LicenseType(models.TextChoices):
        A = 'A', 'A'
        B = 'B', 'B'
        C = 'C', 'C'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ON_ROUTE = 'ON_ROUTE', 'On Route'
        OFF_DUTY = 'OFF_DUTY', 'Off Duty'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_type = models.CharField(max_length=10, choices=LicenseType.choices)
    phone = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        verbose_name = 'driver'
        verbose_name_plural = 'drivers'

    def __str__(self):
        return f"{self.user.get_full_name()} — Licencia {self.license_number}"
