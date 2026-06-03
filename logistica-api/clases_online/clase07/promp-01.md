Ahora que ya tenemos definido el schema de base datos y la arquitectura del proyecto vamos a definir el alcance de esto, en el 
  claude.md tenemos todos los modulos a desarrollar, lo basico seria hacer el CRUD de cada uno.
  
  Para la parte de Auth, usaremos lo que Django nos provee por defecto combinandolo con JWT
  
  Recordemos que queremos trabajar en un MVP, que publicaremos en railway
  
  Crea un documento MD con esto que te estoy pidiendo y te comento que vamos a trabajar con la motodologia SDD (Spect Driven 
  Development)
  
  para esto vamos a crear 4 agentes en la carpeta .claude/agents
  
  Agent1 -  Orquestador: Se encarga de los agentes de Spect, Implement, Validation sigan los pasos establecidos, este agente no 
  escribe codigo, solo se encargar de manejar al equipo
  
  Agent2 - Spect: Se encarga de analizar los requerimiento del proyecto y crear las tareas por cada modulo, recordando que cada modulo
  es un app de Django, este agente tendra que crear por cada modulo una archivo md con la lista de tareas exactas que se deberan 
  hacer, siguiendo la arquitectara y el schema de la base de datos que se encuentran dentro de la carpeta docs, para las creacion de 
  los archivo que contengan las taras, podemos crear la carpeta spec
  
  Agent3 - Implement: Se encarga de leer las tareas que se crearon por modulo y desarrollar en codigo siguiendo las buenas practicas 
  de django, python, la aquitectura y schema de base de datos que se encuentra en la carpeta docs, para esta etapa no tenemos archivos
  de testing, pero revisa bien siempre el codigo hecho
  
  Agent4 - Validator: Se encarga de revisar lo que el agent3 - implement, agrego al proyecto y verificar si esta siguiente los 
  requerimientos, la arquitectura del proyecto y el schema de la base de datos que esta en la carpeta docs, este agente no escribe 
  codigo lo que hara sera crear un md file con los errores que encuentre, en caso no existan errores solo respondera con un mensaje 
  confirmacion
  
  en el agente Orquestador debemos indicar que siempre se siga este flujo, por ende el agente orquestador debe estar referencia en el 
  archivo claude.md para que siempre se tome en cuenta para cada prompt que se envie 