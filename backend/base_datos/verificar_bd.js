const baseDatos = require('./conexion');

// Consultar las tablas creadas
const tablas = baseDatos.prepare(`
    SELECT name AS tabla
    FROM sqlite_master
    WHERE type = 'table'
    AND name LIKE 'GRL_%'
    ORDER BY name
`).all();

// Mostrar las tablas
console.table(tablas);

// Mostrar la cantidad de tablas
console.log('Total de tablas:', tablas.length);

// Verificar que las claves foráneas estén activadas
const clavesForaneas = baseDatos.prepare(
    'PRAGMA foreign_keys'
).get();

console.log('Claves foráneas activadas:',
    clavesForaneas.foreign_keys === 1 ? 'SI' : 'NO'
);

// Cerrar la conexión
baseDatos.close();