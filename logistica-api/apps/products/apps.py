from django.apps import AppConfig


class ProductsConfig(AppConfig):
    # Path completo requerido para que Django resuelva correctamente la app dentro de apps/
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
