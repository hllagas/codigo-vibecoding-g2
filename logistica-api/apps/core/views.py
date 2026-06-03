from django.contrib.auth.models import Group, Permission, User
from rest_framework import mixins, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    GroupSerializer,
    PermissionSerializer,
    ProfileSerializer,
    UserSerializer,
    UserWriteSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(APIView):
    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related('groups__permissions').order_by('id')
    permission_classes = [IsSuperUser]
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return UserWriteSerializer
        return UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related('permissions__content_type').order_by('id')
    serializer_class = GroupSerializer
    permission_classes = [IsSuperUser]
    pagination_class = None


class PermissionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = (
        Permission.objects
        .select_related('content_type')
        .order_by('content_type__app_label', 'content_type__model', 'codename')
    )
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperUser]
    pagination_class = None
