ahora vamos a definir el contexto y el alcance del proyecto, esto debe estar en el claude.md
  
  Alcance: Crear un API Rest Full, usando django-rest-framework, siguiendo las buenas practicas de desarrollo, esta api tendra los 
  siguientes módulos:
  
  - cliente (customer) empresa o persona que genera envios
  - envio (sipment) unidad central de negocio, Esta compuesto por origen, destino, estado, fecha de entrega, etc, costo calculado
  - productos (products) son los productos de tecnologia que seran enviados
  - transporte (transport) seria el medio en el que vamos a entregar los productos a los clientes
  - conductor (driver) persona asignada al transporte
  - ruta (route) secuencia de paradas del transporte
  - almance (warehouse) punto de partida y de almanamiento de los productos
  - proveedores (suppliers) las empresas que nos venden los productos
  
  esto es solo documentacion para el claude.md, luego vamos a tener una fase de desarrollo 