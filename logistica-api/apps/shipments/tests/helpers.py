"""
Helpers compartidos para los tests del módulo shipments.

Proveen funciones factory para crear instancias de todos los modelos
necesarios en el setUp de los tests, evitando duplicación de código.
"""
import datetime
from decimal import Decimal

from django.contrib.auth.models import User

from apps.customers.models import Customer, CustomerType
from apps.drivers.models import Driver
from apps.products.models import Product
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentItem
from apps.suppliers.models import Supplier
from apps.transports.models import Transport, TransportType
from apps.warehouses.models import Warehouse


def make_user(username='testuser', **kwargs):
    defaults = dict(password='testpass123')
    defaults.update(kwargs)
    return User.objects.create_user(username=username, **defaults)


def make_supplier(name='Proveedor Test', **kwargs):
    counter = Supplier.objects.count()
    defaults = dict(
        name=name,
        email=f'proveedor{counter}@test.com',
        city='Bogota',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


def make_customer(name='Cliente Test', **kwargs):
    counter = Customer.objects.count()
    defaults = dict(
        name=name,
        customer_type=CustomerType.COMPANY,
        email=f'cliente{counter}@test.com',
        city='Bogota',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


def make_warehouse(name='Almacen Test', **kwargs):
    counter = Warehouse.objects.count()
    defaults = dict(
        name=f'{name} {counter}',
        address='Calle 1 # 2-3',
        city='Bogota',
        country='Colombia',
        capacity=1000,
    )
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_product(sku=None, **kwargs):
    counter = Product.objects.count()
    if sku is None:
        sku = f'SKU-{counter:04d}'
    supplier = make_supplier(name=f'Proveedor {counter}')
    defaults = dict(
        name='Laptop Test',
        sku=sku,
        category='laptop',
        unit_price=Decimal('999.99'),
        weight_kg=Decimal('2.000'),
        supplier=supplier,
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


def make_driver(username=None, license_number=None, **kwargs):
    counter = Driver.objects.count()
    if username is None:
        username = f'driver{counter}'
    if license_number is None:
        license_number = f'LIC-{counter:04d}'
    user = User.objects.create_user(username=username, password='driverpass123')
    defaults = dict(
        user=user,
        license_number=license_number,
        license_expiry=datetime.date(2030, 12, 31),
        phone='3001234567',
    )
    defaults.update(kwargs)
    return Driver.objects.create(**defaults)


def make_transport(plate_number=None, **kwargs):
    counter = Transport.objects.count()
    if plate_number is None:
        plate_number = f'ABC{counter:03d}'
    defaults = dict(
        name=f'Camion {counter}',
        plate_number=plate_number,
        transport_type=TransportType.TRUCK,
        capacity_kg=Decimal('5000.00'),
    )
    defaults.update(kwargs)
    return Transport.objects.create(**defaults)


def make_route(warehouse=None, transport=None, **kwargs):
    counter = Route.objects.count()
    if warehouse is None:
        warehouse = make_warehouse()
    if transport is None:
        transport = make_transport()
    defaults = dict(
        name=f'Ruta Test {counter}',
        origin_warehouse=warehouse,
        transport=transport,
    )
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


def make_shipment(customer, warehouse, tracking=None, **kwargs):
    counter = Shipment.objects.count()
    if tracking is None:
        tracking = f'TRK-{counter:04d}'
    defaults = dict(
        tracking_number=tracking,
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='Calle 50 # 10-20',
        destination_city='Medellin',
        destination_country='Colombia',
        scheduled_delivery_date=datetime.date(2027, 6, 30),
        total_weight_kg=Decimal('5.00'),
    )
    defaults.update(kwargs)
    return Shipment.objects.create(**defaults)


def make_shipment_item(shipment, product, quantity=1, **kwargs):
    defaults = dict(
        shipment=shipment,
        product=product,
        quantity=quantity,
        unit_price_at_shipment=product.unit_price,
    )
    defaults.update(kwargs)
    return ShipmentItem.objects.create(**defaults)
