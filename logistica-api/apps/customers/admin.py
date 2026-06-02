from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'customer_type', 'tax_id', 'email', 'city', 'country', 'is_active')
    list_filter = ('is_active', 'customer_type', 'country')
    search_fields = ('name', 'tax_id', 'email')
