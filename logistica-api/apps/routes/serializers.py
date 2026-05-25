from rest_framework import serializers

from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = '__all__'
        read_only_fields = ['id', 'route']

    def validate(self, data):
        route = self.context.get('route')
        stop_order = data.get('stop_order')
        if route and stop_order is not None:
            qs = RouteStop.objects.filter(route=route, stop_order=stop_order)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'stop_order': 'Ya existe una parada con este orden en la ruta.'}
                )
        return data


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
