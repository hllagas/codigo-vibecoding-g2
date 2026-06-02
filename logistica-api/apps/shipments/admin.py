from django.contrib import admin

from .models import Shipment, ShipmentItem


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'customer', 'origin_warehouse', 'status', 'scheduled_delivery_date', 'actual_delivery_date')
    list_filter = ('status',)
    search_fields = ('tracking_number', 'customer__name')
    inlines = [ShipmentItemInline]


@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'product', 'quantity', 'unit_price_at_shipment')
    search_fields = ('shipment__tracking_number', 'product__name')
