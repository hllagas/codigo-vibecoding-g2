from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Customer

User = get_user_model()


class CustomerRegistrationSerializer(serializers.Serializer):
    # auth_user fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    # Customer profile fields
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    company_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True, allow_null=True
    )
    tax_id = serializers.CharField(
        max_length=20, required=False, allow_blank=True, allow_null=True
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con ese nombre de usuario."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con ese correo electrónico."
            )
        return value

    def validate_tax_id(self, value):
        if value is not None and value != '':
            if Customer.objects.filter(tax_id=value).exists():
                raise serializers.ValidationError(
                    "Ya existe un cliente con ese número de identificación fiscal."
                )
        return value


class CustomerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'company_name',
            'tax_id',
            'phone',
            'address',
            'city',
            'country',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
