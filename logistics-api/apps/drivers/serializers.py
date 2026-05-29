from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Driver

User = get_user_model()


class DriverRegistrationSerializer(serializers.Serializer):
    # auth_user fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    # Driver profile fields
    license_number = serializers.CharField(max_length=50)
    license_type = serializers.ChoiceField(choices=Driver.LicenseType.choices)
    phone = serializers.CharField(max_length=20)
    status = serializers.ChoiceField(choices=Driver.Status.choices, required=False)

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

    def validate_license_number(self, value):
        if Driver.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con ese número de licencia."
            )
        return value


class DriverSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'license_number',
            'license_type',
            'phone',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
