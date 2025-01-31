# LocalSQLite.js: Un Manejador de Base de Datos en Memoria

## 📌 Descripción
Una librería en JavaScript puro que funcioná como un motor de base de datos simple. Esta librería permite operaciones básicas de bases de datos utilizando una sintaxis SQL simplificada. La librería es ligera, eficiente y compatible con navegadores modernos, sin depender de bibliotecas externas.

![Small Image](./logo.png)

---

## 🚀 Instalación y Uso
Para utilizar **DBEngine**, sigue los siguientes pasos:
---
### Lib:
  URL: https://jorgedipra.github.io/LocalSQLite.js/lib/LocalSQLite.js

### 1️⃣ Creación de la base de datos
```javascript
const db = new DBEngine('usersDB'); // Base de datos de usuarios
const db2 = new DBEngine('cargosDB'); // Otra base de datos
const db3 = new DBEngine('joinDB'); // Base de datos para joins
```
### 2️⃣ Cargar y crear tablas con Index
```javascript
    // Crear la tabla 'users' y añadir registros
    db.createTable('users',  // Nombre de la tabla
        ['name', 'email', 'age'],   // Campos
        'email' // Campo unico
    );
    db.createIndex('users', 'email');  // Índice en el campo "email"
```
###  3️⃣ Insertar datos en la tabla
#### Insert simple
```javascript
db.insert('users', { name: 'Milena', email: 'mile@example.com', age: 30 });
db.insert('users', { name: 'Jorge', email: 'jorge@example.com', age: 30 });
db.insert('users', { name: 'Ana', email: 'ana@example.com', age: 25 });
```
#### Insert simple  autoSave desactivado
Al final de todas las inserciones, ejecutas db3.save() para persistir todos los cambios en una sola operación.
```javascript
db3.insert('orders', { userId: 1, product: 'Laptop' }, false); // No guardar aún
db3.insert('orders', { userId: 2, product: 'Smartphone' }, false); // No guardar aún
db3.insert('orders', { userId: 1, product: 'Headphones' }, false); // No guardar aún
// Guardar manualmente al final
db3.save(); // persisten todos los datos
```
#### Insert simple  autoSave activado manual
Al pasar false como tercer argumento, evitas que se ejecute this.save() después de cada inserción.Esto reduce las operaciones de escritura en localStorage de 3 a 1
```javascript
db3.insert('orders', { userId: 1, product: 'Laptop' }, false); // No guardar aún
db3.insert('orders', { userId: 2, product: 'Smartphone' }, false); // No guardar aún
db3.insert('orders', { userId: 1, product: 'Headphones' }, true); // Guardado total
```
#### Insert Multiple
```javascript
// Usa MultipleInsert para insertar todos los registros en una sola llamada
db.MultipleInsert('users', [
    { name: 'Milena', email: 'mile@example.com', age: 30 },
    { name: 'Jorge', email: 'jorge@example.com', age: 30 },
    { name: 'Ana', email: 'ana@example.com', age: 25 },
    { name: 'Michael', email: 'mmm@example.com', age: 25 },
    { name: 'Jorgito', email: 'Jorgito@example.com', age: 30 },
    { name: 'Jorgito', email: 'Jorgito2@example.com', age: 30 },
    { name: 'Jorgito', email: 'Jorgito3@example.com', age: 30 }
]);
```
# 🛠️ Consultas Disponibles
## 🧩 INDEX
### Muestra los Index
```javascript
const emailIndex = db.tables['users'].indexes['email'];

    for (const email in emailIndex) {
        console.log(`Index-Email: ${email}`);
        emailIndex[email].forEach(record => {
            console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, age: ${record.age}`);
        });
    }
```  
         
## 🔍 SELECT
### SELECT ALL
```SQL
SELECT * FROM users;
```
```javascript
const results = db.select('users');
results.forEach(record => {
    console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, Age: ${record.age}`);
});
```
### SELECT DISTINCT
```SQL
SELECT DISTINCT name, age FROM users;
```
```javascript
const resultsDistinct = db.select('users', {}, 'AND', ['name', 'age'], {}, ['name', 'age']);
resultsDistinct.forEach(record => {
    console.log(`Name: ${record.name}, Age: ${record.age}`);
});
```
### SELECT ORDER BY ASC
```SQL
SELECT name, age FROM users ORDER BY name ASC;
```
```javascript
const resultsOrdered = db.select('users', {}, 'AND', ['name', 'age'], [{ column: 'name', order: 'ASC' }]);
resultsOrdered.forEach(record => {
    console.log(`Name: ${record.name}, Age: ${record.age}`);
});
```
### SELECT ORDER BY DES
```SQL
SELECT name, age FROM users ORDER BY name DES;
```
```javascript
const resultsOrdered = db.select('users', {}, 'AND', ['name', 'age'], [{ column: 'name', order: 'DES' }]);
resultsOrdered.forEach(record => {
    console.log(`Name: ${record.name}, Age: ${record.age}`);
});
```
### SELECT WHERE
```SQL
SELECT * FROM users WHERE age = 25;
```
```javascript
const resultsWhere = db.select('users', { age: 25 });
resultsWhere.forEach(record => {
    console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, Age: ${record.age}`);
});
```
### SELECT WHERE OR LIKE
```SQL
SELECT * FROM users WHERE age = 25 OR name LIKE "%na%";
```
```javascript
const resultsWherelike = db.select('users', { name: { $like: 'na' }, age: 25 }, 'OR');
resultsWherelike.forEach(record => {
    console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, Age: ${record.age}`);
});

```
### SELECT WHERE AND LIKE
```SQL
SELECT * FROM users WHERE age = 25 AND name LIKE "%na%";
```
```javascript
const resultsWherelike = db.select('users', { name: { $like: 'na' }, age: 25 }, 'AND');
resultsWherelike.forEach(record => {
    console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, Age: ${record.age}`);
});

```
### Agregación (COUNT, SUM, AVG, MIN, MAX)
- COUNT: Cuenta registros. Si el campo es *, cuenta todos; si es un campo, cuenta valores no nulos.

- SUM/AVG: Ignora valores no numéricos y realiza la operación solo con datos válidos.

- MIN/MAX: Encuentra el valor mínimo/máximo válido en el campo especificado.

- Manejo de Errores: 
    - Si la tabla no existe, retorna un objeto vacío.
    - Si se especifica una función no soportada, muestra un error y retorna null.
- Notas Clave:
   - Validación de Campos: Las operaciones ignoran valores undefined o no numéricos.

   - Precisión: AVG redondea según JavaScript, pero puedes ajustarlo con toFixed() si es necesario.

   - Eficiencia: Al reutilizar select, se aprovechan índices y optimizaciones existentes.
```SQL
SELECT 
    COUNT(*) AS total, 
    AVG(age) AS avgAge, 
    MAX(age) AS maxAge , 
    MIN(age) AS minAge , 
    SUM(age) AS sumAge
FROM users 
    WHERE name like "jo"; 
```
```javascript
 const resultsAggregate = db.selectAggregate('users', {
                where: { name: { $like: 'jo' } }, // Filtro WHERE
                aggregate: {
                    total: 'COUNT(*)',
                    avgAge: 'AVG(age)',
                    maxAge: 'MAX(age)',
                    minAge: 'MIN(age)',
                    sumAge: 'SUM(age)'
                }
            });

const result = resultsAggregate;
    console.log(`Total: ${result.total}, Promedio: ${result.avgAge}, Máximo: ${result.maxAge}, Mínimo: ${result.minAge}, Suma de edades: ${result.sumAge}`);
```
### UPDATE 
```SQL
UPDATE users SET age = 35 WHERE name = "Jorge"
```
```javascript
const updatedRows = db.update('users', { name: 'Jorge' }, { age: 35 });
console.warn(`Registros actualizados: ${updatedRows}`);
```

## 🗑️ Uso de DELETE 
### DELETE WHERE
```SQL
DELETE FROM users WHERE id = 3;
```
```javascript
db.delete('users', { id: 3 });
const resultsAfterDelete = db.select('users');
resultsAfterDelete.forEach(record => {
    console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}`);
});
```
## 🔗 Uso de JOIN
### JOIN 
```SQL
SELECT users.name, orders.product FROM users INNER JOIN orders ON users.id = orders.userId;
```
```javascript
db3.load().then(() => {
    db3.createTable('users', ['id', 'name', 'age'], 'name');
    db3.createTable('orders', ['id', 'userId', 'product'], 'product');

    db3.insert('users', { name: 'Jorge', age: 30 });
    db3.insert('users', { name: 'Ana', age: 25 });

    db3.insert('orders', { userId: 1, product: 'Laptop' });
    db3.insert('orders', { userId: 2, product: 'Smartphone' });
    db3.insert('orders', { userId: 1, product: 'Headphones' });

    const resultJoin = db3.join('users', 'orders', 'id', 'userId');
    resultJoin.forEach(record => {
        console.log(`Name: ${record.name}, Product: ${record.product}`);
    });
});
```
# 📖 Funcionalidades Implementadas
    ✅ Creación y manipulación de tablas
    ✅ Inserción de registros con claves únicas
    ✅ Consultas SELECT con filtros WHERE
    ✅ Búsquedas con LIKE
    ✅ Ordenación con ORDER BY
    ✅ Eliminación de registros con DELETE
    ✅ Eliminación de duplicados con DISTINCT
    ✅ Soporte para JOIN entre tablas
    ✅ Soporte para UPDATE de registros
    ✅ Implementación de índices para Optimización de consultas
    ✅ Métodos de Agregación estos permite un Soporte a funciones como COUNT, SUM, AVG, MIN, MAX.

# 🔧 Próximas Mejoras
    🔹 Implementación de transacciones con BEGIN y COMMIT
    🔹 Serialización de datos para persistencia en archivos
    🔹 Soporte Claves Foráneas y Relaciones para asegurar consistencia entre tablas relacionadas.
    🔹 Validación de Tipos de Datos para Validar tipos, formatos y campos obligatorios al insertar
    🔹 Paginaciónpara permitir soporte a parámetros como LIMIT y OFFSET con el fin tener resultados paginados.
    🔹 Backup y Restauración
    🔹 Alterar Tablas
    🔹 Soporte para Subconsultas
    🔹 Full-Text Search
    🔹 Triggers
    🔹 Mejorar JOINs
    🔹 Métodos de Utilidad
    🔹 Seguridad (Cifra datos en localStorag y Previene inyección de operadores)
    🔹 Soporte para Promesas/Async