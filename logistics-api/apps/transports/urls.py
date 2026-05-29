from rest_framework.routers import DefaultRouter

from .views import TransportViewSet

router = DefaultRouter()
router.register(r'transports', TransportViewSet)

urlpatterns = router.urls
