from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DriverRegistrationView, DriverViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)

urlpatterns = [
    path('drivers/register/', DriverRegistrationView.as_view(), name='driver-register'),
    path('', include(router.urls)),
]
