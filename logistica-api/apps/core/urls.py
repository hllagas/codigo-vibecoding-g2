from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GroupViewSet, PermissionViewSet, ProfileView, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('groups', GroupViewSet)
router.register('permissions', PermissionViewSet)

urlpatterns = [
    path('auth/me/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
