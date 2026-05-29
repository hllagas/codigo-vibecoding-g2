from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Customer

User = get_user_model()


def create_customer(data):
    """
    Crea un auth_user, lo asigna al grupo 'customer' y crea el perfil Customer.
    Toda la operación es atómica: si falla cualquier paso, se revierten todos los cambios.
    """
    username = data['username']
    email = data['email']
    password = data['password']
    first_name = data['first_name']
    last_name = data['last_name']

    phone = data['phone']
    address = data['address']
    city = data['city']
    country = data['country']
    company_name = data.get('company_name', None)
    tax_id = data.get('tax_id', None)

    with transaction.atomic():
        user = User.objects.create_user(
            username,
            email,
            password,
            first_name=first_name,
            last_name=last_name,
        )

        try:
            group = Group.objects.get(name='customer')
        except Group.DoesNotExist:
            raise ValidationError(
                "El grupo 'customer' no existe en la base de datos. "
                "Ejecutar las migraciones iniciales antes de registrar clientes."
            )

        user.groups.add(group)

        customer = Customer.objects.create(
            user=user,
            phone=phone,
            address=address,
            city=city,
            country=country,
            company_name=company_name,
            tax_id=tax_id,
        )

    return customer
