from django.contrib import admin

from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'origin_warehouse', 'transport', 'status', 'estimated_duration_hours')
    list_filter = ('status',)
    search_fields = ('name',)
    inlines = [RouteStopInline]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ('route', 'stop_order', 'city', 'estimated_arrival', 'actual_arrival')
    list_filter = ('route',)
    search_fields = ('city', 'address')
