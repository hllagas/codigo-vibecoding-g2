from django.contrib import admin

from .models import Warehouse, WarehouseStock


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'country', 'capacity', 'is_active')
    list_filter = ('is_active', 'country')
    search_fields = ('name', 'city')


@admin.register(WarehouseStock)
class WarehouseStockAdmin(admin.ModelAdmin):
    list_display = ('warehouse', 'product', 'quantity', 'updated_at')
    list_filter = ('warehouse',)
    search_fields = ('warehouse__name', 'product__name')
