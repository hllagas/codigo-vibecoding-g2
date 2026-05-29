from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Driver

User = get_user_model()


def create_driver(data):
    """
    Crea un auth_user, lo asigna al grupo 'driver' y crea el perfil Driver.
    Toda la operación es atómica: si falla cualquier paso, se revierten todos los cambios.
    """
    username = data['username']
    email = data['email']
    password = data['password']
    first_name = data['first_name']
    last_name = data['last_name']

    license_number = data['license_number']
    license_type = data['license_type']
    phone = data['phone']
    status = data.get('status', Driver.Status.AVAILABLE)

    with transaction.atomic():
        user = User.objects.create_user(
            username,
            email,
            password,
            first_name=first_name,
            last_name=last_name,
        )

        try:
            group = Group.objects.get(name='driver')
        except Group.DoesNotExist:
            raise ValidationError(
                "El grupo 'driver' no existe en la base de datos. "
                "Ejecutar las migraciones iniciales antes de registrar conductores."
            )

        user.groups.add(group)

        driver = Driver.objects.create(
            user=user,
            license_number=license_number,
            license_type=license_type,
            phone=phone,
            status=status,
        )

    return driver
