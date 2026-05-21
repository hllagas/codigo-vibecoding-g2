vamos a iniciar el proyecto task manager de front con el siguiente stack:
- Vite
- React
- Tailwind
vamos a consumir la api de backend que ahora solo tiene los endpoint para el crud de tareas y usa el siguiente modelo
id: uuid (string)
title: string
description: string
completed: boolean
created_at: date
la ruta del proyecto de backend es localhost:3000/api/tasks
la interface debe ser responsive y tener un ux/ui facil de usar
para el detalle de la tarea, quiero que sea una nueva ruta, por ende instala react-router y configuralo para soportar varias rutas en el futuro
para crear, actualizar y eliminar usa dialog que sera un componente que crees usando tailwind