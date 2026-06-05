# Mejorando la visualización de los datos:
Vamos a resolver los siguiente bugs:                                              
  - Los select deben mostrar el texto del element seleccionado, actualmente se      
  muestra el id o el value                                                          
  - En shipments no me esta dejando colocar el conductor cuando si existe en un     
  conductor                                                                         
  - En shipments no queda claro como se calcula el costo de cada envio, deberia a   
  ver un lugar donde se explique eso                                                
  - Los input que sean un calendario deben usar el componente input calendar de     
  shadcn, si no lo tenemos hay que instalarlo  


# Para mejorar los graficos del Dashboard

/ui-ux-pro-max ahora analiza los componentes del Dashboard page y mejora el uso de los charts, colores de los textos, colores de fondo, que los textos sean visibles y en general que los componentes de esta vista sean responsive 


# Mejorando algunos gráficos que no se ven y están en negro

/ui-ux-pro-max [Image #2] aun el grafico circular no se ve correctamente que sea de color negro ayudar a distinguir los valores, ademas en hover el texto que aparece no se ve, esto mismo pasa en el graficos de barras "Flota por tipo de transporte", analiza de forma detallada estos componentes y propon una mejora a nivel de UI/UX 


# Para mejorar las tablas de los CRUD

/ui-ux-pro-max ahora vamos a mejorar la UI de las tablas, asegurandonos que usemos tanStack table y paginacion en estas, ademas para los filtros en mobile usemos el component Sheet de ShadCN para tener un mejor de la UX, esto se debe replicar en todos los page que usen tablas y filtros 


# Mejorando la experiencia UI
/ui-ux-pro-max utilizando la biblioteca de animación Framer Motion propon una mejor experiencia de UI pero que el fondo del background no sea de color negro
Engineer


# Mejorando las entradas en las búsquedas de las tablas que no coincide con la lista para busqueda
he encontrado un bug en el buscador de todas las pages, no se puede escribir, utiliza el manejo del estado de ese input