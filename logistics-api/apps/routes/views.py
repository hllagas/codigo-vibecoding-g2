from rest_framework.viewsets import ModelViewSet

from apps.routes.models import Route, RouteStop
from apps.routes.serializers import RouteSerializer, RouteStopSerializer


class RouteViewSet(ModelViewSet):
    queryset = Route.objects.select_related('origin_warehouse').prefetch_related('stops').all()
    serializer_class = RouteSerializer


class RouteStopViewSet(ModelViewSet):
    queryset = RouteStop.objects.select_related('route').all()
    serializer_class = RouteStopSerializer
