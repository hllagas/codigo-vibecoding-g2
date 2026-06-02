from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'tax_id', 'email', 'city', 'country', 'is_active')
    list_filter = ('is_active', 'country')
    search_fields = ('name', 'tax_id', 'email')
