from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CustomerRegistrationView, CustomerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('customers/register/', CustomerRegistrationView.as_view(), name='customer-register'),
    path('', include(router.urls)),
]
