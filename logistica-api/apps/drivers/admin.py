from django.contrib import admin

from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'license_expiry', 'phone', 'is_available')
    list_filter = ('is_available',)
    search_fields = ('user__username', 'license_number')
