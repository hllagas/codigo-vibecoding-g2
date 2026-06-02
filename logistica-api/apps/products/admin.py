from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'unit_price', 'weight_kg', 'supplier', 'is_active')
    list_filter = ('is_active', 'category')
    search_fields = ('name', 'sku')
