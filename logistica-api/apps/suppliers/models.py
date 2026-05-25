from django.db import models


class Supplier(models.Model):
    # Nombre de la empresa proveedora
    name = models.CharField(max_length=255, null=False)
    # Identificador fiscal (RUC/NIT) — opcional pero único si se provee
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    # Correo electrónico de contacto — requerido
    email = models.EmailField(max_length=254, null=False)
    # Teléfono de contacto — opcional
    phone = models.CharField(max_length=20, null=True, blank=True)
    # Dirección física — opcional
    address = models.TextField(null=True, blank=True)
    # Ciudad donde opera el proveedor — requerido
    city = models.CharField(max_length=100, null=False)
    # País donde opera el proveedor — requerido
    country = models.CharField(max_length=100, null=False)
    # Estado activo/inactivo del proveedor
    is_active = models.BooleanField(default=True)
    # Fechas de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']

    def __str__(self):
        return self.name
