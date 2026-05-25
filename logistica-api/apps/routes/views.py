from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related('origin_warehouse', 'transport').all()
    serializer_class = RouteSerializer
    filterset_fields = ['status', 'transport', 'origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['name', 'status', 'created_at', 'started_at']

    @extend_schema(methods=['GET'], operation_id='route_stops_list', responses={200: RouteStopSerializer(many=True)})
    @extend_schema(methods=['POST'], operation_id='route_stops_create', responses={201: RouteStopSerializer})
    @action(methods=['get', 'post'], detail=True, url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()
        if request.method == 'GET':
            stops = RouteStop.objects.filter(route=route).order_by('stop_order')
            serializer = RouteStopSerializer(stops, many=True)
            return Response(serializer.data)
        ctx = {**self.get_serializer_context(), 'route': route}
        serializer = RouteStopSerializer(data=request.data, context=ctx)
        if serializer.is_valid():
            serializer.save(route=route)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(methods=['GET'], operation_id='route_stop_retrieve',
                   parameters=[OpenApiParameter('stop_id', int, OpenApiParameter.PATH)],
                   responses={200: RouteStopSerializer})
    @extend_schema(methods=['PUT'], operation_id='route_stop_update',
                   parameters=[OpenApiParameter('stop_id', int, OpenApiParameter.PATH)],
                   responses={200: RouteStopSerializer})
    @extend_schema(methods=['PATCH'], operation_id='route_stop_partial_update',
                   parameters=[OpenApiParameter('stop_id', int, OpenApiParameter.PATH)],
                   responses={200: RouteStopSerializer})
    @extend_schema(methods=['DELETE'], operation_id='route_stop_destroy',
                   parameters=[OpenApiParameter('stop_id', int, OpenApiParameter.PATH)],
                   responses={204: None})
    @action(
        methods=['get', 'put', 'patch', 'delete'],
        detail=True,
        url_path=r'stops/(?P<stop_id>[^/.]+)',
    )
    def stop_detail(self, request, pk=None, stop_id=None):
        route = self.get_object()
        stop = get_object_or_404(RouteStop, id=stop_id, route=route)
        ctx = {**self.get_serializer_context(), 'route': route}
        if request.method == 'GET':
            return Response(RouteStopSerializer(stop, context=ctx).data)
        if request.method == 'DELETE':
            stop.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        partial = request.method == 'PATCH'
        serializer = RouteStopSerializer(stop, data=request.data, partial=partial, context=ctx)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
