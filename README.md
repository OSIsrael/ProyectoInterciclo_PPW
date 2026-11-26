## Inicialización de la base de datos

El proyecto utiliza SQLite mediante el módulo
node:sqlite integrado en Node.js.

### Instalar las dependencias del backend

```bash
cd backend
npm install
cd ..
```

### Crear las tablas

```bash
node backend/base_datos/inicializar_bd.js
```

### Cargar los datos semilla

```bash
node backend/base_datos/datos_semilla.js
```

### Verificar la base de datos

```bash
node backend/base_datos/verificar_bd.js
node backend/base_datos/probar_bd.js
node backend/base_datos/verificar_semilla.js
```

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | Admin123* | Administrador |
| docente1 | Docente123* | Docente |
| docente2 | Docente123* | Docente |
| docente3 | Docente123* | Docente |
| estudiante1 | Estudiante123* | Estudiante |
| estudiante2 | Estudiante123* | Estudiante |
| estudiante3 | Estudiante123* | Estudiante |
| estudiante4 | Estudiante123* | Estudiante |
| estudiante5 | Estudiante123* | Estudiante |

Las contraseñas se almacenan mediante hashes generados
con bcryptjs y un factor de costo de 10.

Estas credenciales son exclusivamente para pruebas
y desarrollo local.

## Laboratorios de prueba

| Laboratorio | Capacidad | Estado |
|---|---|---|
| Computacion 1 | 25 | Disponible |
| Redes | 20 | Disponible |
| Electronica | 15 | Mantenimiento |


El script de datos semilla puede ejecutarse varias
veces sin duplicar los registros, siempre que se
mantengan sus identificadores de búsqueda.