from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Driver
from .serializers import DriverRegistrationSerializer, DriverSerializer
from .services import create_driver


class DriverRegistrationView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=DriverRegistrationSerializer,
        responses={201: DriverSerializer},
        summary='Registro de conductor',
        description='Crea un usuario y perfil de conductor en una sola operación. No requiere autenticación.',
        tags=['Drivers'],
    )
    def post(self, request):
        serializer = DriverRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = create_driver(serializer.validated_data)
        serializer_out = DriverSerializer(driver)
        return Response(serializer_out.data, status=status.HTTP_201_CREATED)


class DriverViewSet(ModelViewSet):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
