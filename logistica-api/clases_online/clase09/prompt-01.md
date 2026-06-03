vamos a agregar en la web lo siguiente:
  - si el usuario que se autentica es un superadmin, entonces tendra la opcion de crear nuevos usuarios y asignar roles y permisos (groups en django admin)
  - para poder hacer necesitamos crear los endpoints necesarios para ello, recordemos que tenemos una app core, podemos podemos agregar estos endpoints a esa
  app, para que front pueda construir la interface
  - analiza si es necesario un endpoint de custom login para poder retornar si el usuario autenticado es un super admin