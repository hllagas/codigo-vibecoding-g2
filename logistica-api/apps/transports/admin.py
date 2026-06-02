from django.contrib import admin

from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ('name', 'plate_number', 'transport_type', 'capacity_kg', 'driver', 'is_active')
    list_filter = ('is_active', 'transport_type')
    search_fields = ('name', 'plate_number')
