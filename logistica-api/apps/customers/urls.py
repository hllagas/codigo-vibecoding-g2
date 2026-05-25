from rest_framework.routers import DefaultRouter

from .views import CustomerViewSet

# Router genera automáticamente los endpoints CRUD para customers
router = DefaultRouter()
router.register(r'customers', CustomerViewSet)

urlpatterns = router.urls
