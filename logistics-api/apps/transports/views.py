from rest_framework.viewsets import ModelViewSet

from .models import Transport
from .serializers import TransportSerializer


class TransportViewSet(ModelViewSet):
    queryset = Transport.objects.all()
    serializer_class = TransportSerializer
