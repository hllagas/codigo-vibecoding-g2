"""
Configuración de URLs raíz del proyecto logistica-api.

Registra admin, JWT, placeholder para las apps de dominio (fases 2-8),
schema OpenAPI y Swagger UI.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Panel de administración de Django
    path('admin/', admin.site.urls),

    # Rutas agrupadas bajo /api/v1/
    path('api/v1/', include([
        # Autenticación JWT: POST /api/v1/auth/token/ y /api/v1/auth/token/refresh/
        path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        # Apps de dominio Phase 2
        path('', include('apps.suppliers.urls')),
        path('', include('apps.warehouses.urls')),
        path('', include('apps.customers.urls')),
        # Apps de dominio Phase 3
        path('', include('apps.products.urls')),
        # Apps de dominio Phase 4
        path('', include('apps.drivers.urls')),
        # Apps de dominio Phase 6
        path('', include('apps.transports.urls')),
        # Apps de dominio Phase 7
        path('', include('apps.routes.urls')),
        # Apps de dominio Phase 8
        path('', include('apps.shipments.urls')),
    ])),

    # Schema OpenAPI 3 — público, sin auth
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),

    # Swagger UI — público, sin auth
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
]
