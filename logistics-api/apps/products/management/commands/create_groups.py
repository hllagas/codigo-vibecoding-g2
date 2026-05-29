from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

GROUPS = ['admin', 'operator', 'driver', 'customer']


class Command(BaseCommand):
    help = 'Crea los grupos de permisos del sistema'

    def handle(self, *args, **options):
        for name in GROUPS:
            group, created = Group.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Grupo creado: {name}'))
            else:
                self.stdout.write(f'Grupo ya existe: {name}')
