from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentProductViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'shipment-products', ShipmentProductViewSet, basename='shipment-product')

urlpatterns = router.urls
