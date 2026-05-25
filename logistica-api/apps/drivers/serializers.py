from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Driver

User = get_user_model()


class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DriverSerializer(serializers.ModelSerializer):
    user_detail = UserReadSerializer(source='user', read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id',
            'user',
            'user_detail',
            'license_number',
            'license_expiry',
            'phone',
            'is_available',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user_detail', 'created_at', 'updated_at']
