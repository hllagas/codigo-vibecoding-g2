from django.db import models


class CustomerType(models.TextChoices):
    # Empresa o persona jurídica
    COMPANY = 'company', 'Company'
    # Persona natural
    INDIVIDUAL = 'individual', 'Individual'


class Customer(models.Model):
    # Nombre o razón social del cliente
    name = models.CharField(max_length=255, null=False)
    # Tipo de cliente: empresa o persona natural — requerido
    customer_type = models.CharField(
        max_length=20,
        choices=CustomerType.choices,
        null=False,
    )
    # Identificador fiscal (RUC/NIT) — opcional pero único si se provee
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    # Correo electrónico de contacto — requerido
    email = models.EmailField(max_length=254, null=False)
    # Teléfono de contacto — opcional
    phone = models.CharField(max_length=20, null=True, blank=True)
    # Dirección física — opcional
    address = models.TextField(null=True, blank=True)
    # Ciudad donde reside el cliente — requerido
    city = models.CharField(max_length=100, null=False)
    # País donde reside el cliente — requerido
    country = models.CharField(max_length=100, null=False)
    # Estado activo/inactivo del cliente
    is_active = models.BooleanField(default=True)
    # Fechas de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['name']

    def __str__(self):
        return self.name
