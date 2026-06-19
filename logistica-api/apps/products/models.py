from django.db import models


class Product(models.Model):
    # Nombre del producto — requerido
    name = models.CharField(max_length=255, null=False)
    # Descripción opcional del producto
    description = models.TextField(null=True, blank=True)
    # Código interno de inventario — único por producto
    sku = models.CharField(max_length=100, unique=True, null=False)
    # Categoría libre: laptop, smartphone, tablet, monitor, server, etc.
    category = models.CharField(max_length=100, null=False)
    # Precio unitario actual del producto
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    # Peso del producto en kilogramos
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3, null=False)
    # Proveedor del producto — opcional, PROTECT evita eliminar proveedor con productos asociados
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    # Imagen del producto — almacenada en GCS o en FileSystemStorage según configuración
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    # Estado activo/inactivo del producto
    is_active = models.BooleanField(default=True)
    # Fechas de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.sku})'
