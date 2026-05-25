from django.conf import settings
from django.db import models


class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['user__username']

    def __str__(self):
        return f"{self.user.username} — {self.license_number}"
