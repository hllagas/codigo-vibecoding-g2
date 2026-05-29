from django.core.exceptions import ValidationError


def update_stock(product, quantity, operation):
    """
    Incrementa o decrementa el stock de un producto.

    Parametros:
        product  -- instancia de Product
        quantity -- cantidad a sumar o restar (siempre positivo)
        operation -- 'INCR' para incrementar, 'DECR' para decrementar
    """
    if operation == 'INCR':
        new_stock = product.stock + quantity
    elif operation == 'DECR':
        new_stock = product.stock - quantity
        if new_stock < 0:
            raise ValidationError(
                f"Stock insuficiente para el producto {product.sku}. "
                f"Stock disponible: {product.stock}, cantidad solicitada: {quantity}."
            )
    else:
        raise ValidationError(
            f"Operacion invalida '{operation}'. Los valores permitidos son 'INCR' y 'DECR'."
        )

    product.stock = new_stock
    product.save(update_fields=['stock', 'updated_at'])
