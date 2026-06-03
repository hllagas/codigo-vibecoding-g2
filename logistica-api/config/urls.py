from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def landing(request):
    return HttpResponse("<h1>LogistiFlow — Plataforma de Gestión Logística</h1>")


urlpatterns = [
    path('', landing, name='landing'),
    # Panel de administración de Django
    path('admin/', admin.site.urls),

    # Rutas agrupadas bajo /api/v1/
    path('api/v1/', include([        
        path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),        
        path('', include('apps.suppliers.urls')),
        path('', include('apps.warehouses.urls')),
        path('', include('apps.customers.urls')),        
        path('', include('apps.products.urls')),        
        path('', include('apps.drivers.urls')),        
        path('', include('apps.transports.urls')),        
        path('', include('apps.routes.urls')),        
        path('', include('apps.shipments.urls')),
    ])),

    # Schema OpenAPI 3 — público, sin auth
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),

    # Swagger UI — público, sin auth
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
]
