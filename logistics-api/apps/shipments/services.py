from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.products.services import update_stock
from apps.products.models import Product
from apps.transports.models import Transport
from apps.drivers.models import Driver

from .models import Shipment, ShipmentProduct


VALID_TRANSITIONS = {
    Shipment.Status.PENDING: [Shipment.Status.PICKED_UP, Shipment.Status.CANCELLED],
    Shipment.Status.PICKED_UP: [Shipment.Status.IN_TRANSIT],
    Shipment.Status.IN_TRANSIT: [Shipment.Status.DELIVERED, Shipment.Status.RETURNED],
    Shipment.Status.DELIVERED: [],
    Shipment.Status.CANCELLED: [],
    Shipment.Status.RETURNED: [],
}


def create_shipment(validated_data):
    """
    Crea un Shipment completo con sus ShipmentProduct asociados.
    Descuenta stock de cada producto y calcula peso y costo total.
    Toda la operacion es atomica.
    """
    products_data = validated_data.pop('products')
    with transaction.atomic():
        shipment = Shipment.objects.create(**validated_data)
        total_weight = Decimal('0.000')

        for item in products_data:
            try:
                product = Product.objects.select_for_update().get(id=item['product_id'])
            except Product.DoesNotExist:
                raise ValidationError(
                    f"El producto con id={item['product_id']} no existe."
                )
            update_stock(product, item['quantity'], 'DECR')
            ShipmentProduct.objects.create(
                shipment=shipment,
                product=product,
                quantity=item['quantity'],
                unit_price=product.unit_price,
            )
            total_weight += product.weight_kg * item['quantity']

        shipment.total_weight_kg = total_weight
        calculate_shipping_cost(shipment)
        shipment.save(update_fields=['total_weight_kg', 'shipping_cost'])

    return shipment


def calculate_shipping_cost(shipment):
    """
    Calcula el costo del envio basado en peso y cantidad de productos.
    Asigna el resultado a shipment.shipping_cost pero NO llama shipment.save().
    Retorna el costo calculado como Decimal.
    """
    cantidad = shipment.shipment_products.count()
    costo = (
        Decimal('50.00')
        + (shipment.total_weight_kg * Decimal('2.5'))
        + (Decimal(cantidad) * Decimal('5.0'))
    )
    shipment.shipping_cost = costo.quantize(Decimal('0.01'))
    return shipment.shipping_cost


def assign_transport(shipment, transport, driver):
    """
    Asigna un transporte y conductor a un envio.
    Valida disponibilidad de ambos y actualiza sus estados.
    """
    if transport.status != Transport.Status.AVAILABLE:
        raise ValidationError(
            f"El transporte {transport.license_plate} no esta disponible. "
            f"Estado actual: {transport.status}."
        )
    if driver.status != Driver.Status.AVAILABLE:
        raise ValidationError(
            f"El conductor {driver.user.get_full_name()} no esta disponible. "
            f"Estado actual: {driver.status}."
        )
    with transaction.atomic():
        shipment.transport = transport
        shipment.driver = driver
        shipment.save(update_fields=['transport', 'driver', 'updated_at'])

        transport.status = Transport.Status.IN_ROUTE
        transport.save(update_fields=['status', 'updated_at'])

        driver.status = Driver.Status.ON_ROUTE
        driver.save(update_fields=['status', 'updated_at'])

    return shipment


def update_shipment_status(shipment, new_status):
    """
    Cambia el estado de un envio validando que la transicion sea valida.
    Ejecuta efectos secundarios segun el estado destino.
    """
    current_status = shipment.status
    allowed = VALID_TRANSITIONS.get(current_status, [])

    if new_status not in allowed:
        raise ValidationError(
            f"Transicion invalida: no se puede pasar de {current_status} a {new_status}."
        )

    with transaction.atomic():
        shipment.status = new_status
        update_fields = ['status', 'actual_delivery_date', 'updated_at']

        if new_status == Shipment.Status.DELIVERED:
            shipment.actual_delivery_date = timezone.now().date()
            _release_transport_and_driver(shipment)

        elif new_status in [Shipment.Status.CANCELLED, Shipment.Status.RETURNED]:
            _revert_stock(shipment)
            _release_transport_and_driver(shipment)

        shipment.save(update_fields=update_fields)

    return shipment


def _release_transport_and_driver(shipment):
    """Libera transport y driver asignados al envio (los marca como AVAILABLE)."""
    if shipment.transport:
        shipment.transport.status = Transport.Status.AVAILABLE
        shipment.transport.save(update_fields=['status', 'updated_at'])
    if shipment.driver:
        shipment.driver.status = Driver.Status.AVAILABLE
        shipment.driver.save(update_fields=['status', 'updated_at'])


def _revert_stock(shipment):
    """Revierte (incrementa) el stock de todos los productos del envio."""
    for sp in shipment.shipment_products.select_related('product').all():
        update_stock(sp.product, sp.quantity, 'INCR')
