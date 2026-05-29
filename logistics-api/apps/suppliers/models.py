from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    tax_id = models.CharField(max_length=20, unique=True)
    contact_name = models.CharField(max_length=200)
    email = models.CharField(max_length=254)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'supplier'
        verbose_name_plural = 'suppliers'

    def __str__(self):
        return f"{self.tax_id} — {self.name}"
