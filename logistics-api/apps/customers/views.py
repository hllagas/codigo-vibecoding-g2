from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Customer
from .serializers import CustomerRegistrationSerializer, CustomerSerializer
from .services import create_customer


class CustomerRegistrationView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=CustomerRegistrationSerializer,
        responses={201: CustomerSerializer},
        summary='Registro de cliente',
        description='Crea un usuario y perfil de cliente en una sola operación. No requiere autenticación.',
        tags=['Customers'],
    )
    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = create_customer(serializer.validated_data)
        serializer_out = CustomerSerializer(customer)
        return Response(serializer_out.data, status=status.HTTP_201_CREATED)


class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.select_related('user').all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
