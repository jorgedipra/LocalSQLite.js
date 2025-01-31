const db  = new DBEngine('usersDB'); // Creación de la base de datos
const db2 = new DBEngine('cargosDB'); // Creación de la base de datos 2
const db3 = new DBEngine('joinDB'); // Creación de la base de datos 3

db.load().then(() => {
    console.info('------[NUEVA BASE DE DATOS]-------')
    // Crear la tabla 'users' y añadir registros
    db.createTable('users',  // Nombre de la tabla
        ['name', 'email', 'age'],   // Campos
        'email' // Campo unico
    );

    db.createIndex('users', 'email');  // Índice en el campo "email"

    // Usa MultipleInsert para insertar todos los registros en una sola llamada
    msnReturn = db.MultipleInsert('users', [
        { name: 'Milena', email: 'mile@example.com', age: 30 },
        { name: 'Jorge', email: 'jorge@example.com', age: 30 },
        { name: 'Ana', email: 'ana@example.com', age: 25 },
        { name: 'Ana Duplicada', email: 'ana@example.com', age: 30 },
        { name: 'Michael', email: 'mmm@example.com', age: 25 },
        { name: 'Jorgito', email: 'Jorgito@example.com', age: 30 },
        { name: 'Jorgito', email: 'Jorgito2@example.com', age: 30 },
        { name: 'Jorgito', email: 'Jorgito3@example.com', age: 30 }
    ]);
    console.error(msnReturn);
    
    console.warn('------------[SELECT * FROM users;]------------')   
    // Consultar los datos
        // console.log(db.select('users'));
    const results = db.select('users');
        // results.forEach(record => {
        //     console.log(record);
        // });
    
    results.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, age: ${record.age}`);
    });
    // Output:
    // {id: 1, name: 'Jorge', email: 'jorge@example.com', age: 30}
    // {id: 2, name: 'Ana', email: 'ana@example.com', age: 25}
    // {id: 3, name: 'Michael', email: 'mmm@example.com', age: 25}
    // {id: 4, Name: Milena, email: mile@example.com, age: 30}
    // {id: 5, Name: Jorgito, email: Jorgito@example.com, age: 30}
    // {id: 6, Name: Jorgito, email:'Jorgito2@example.com', age: 30 }
    // {id: 7, Name: Jorgito, email:'Jorgito3@example.com', age: 30 }

    console.warn('------------[SELECT * FROM users where email="jorge@example.com"]------------')  
    const resultsIndex = db.select('users', { email: 'jorge@example.com' })

    resultsIndex.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, age: ${record.age}`);
    });

    console.warn('------------[Muestra los Index]------------');

        // Acceder a los índices desde la propiedad `indexes` de la DB
        const usersIndexes = db.indexes['users']; 
        const emailIndex = usersIndexes['email'];

        for (const email in emailIndex) {
            console.log(`Email: ${email}`);
                
            emailIndex[email].forEach(record => {
                console.log(`ID: ${record.id} | Nombre: ${record.name} | Edad: ${record.age}`);
            });
        }

    console.warn('------------[SELECT DISTINCT name, age FROM users;]------------')  
    const resultsDistinct = db.select('users', {}, 'AND', ['name', 'age'], {}, ['name', 'age']);
    // console.log(resultsDistinct);
    resultsDistinct.forEach(record => {
        console.log(`name: ${record.name} age: ${record.age}`);
    });


    console.warn('------------[SELECT name, age FROM users ORDER BY name ASC;]------------')  
    const resultsColumns = db.select('users', {}, 'AND', ['name', 'age'], { column: 'name', order: 'ASC' });
    // console.log(resultsColumns);
    resultsColumns.forEach(record => {
        console.log(`name: ${record.name}, age: ${record.age}`);
    });

    console.warn('------------[SELECT name, age FROM users ORDER BY name DESC;]------------')  
    const results2Columns = db.select('users', {}, 'AND', ['name', 'age'], { column: 'name', order: 'DESC' });
    // console.log(resultsColumns);
    results2Columns.forEach(record => {
        console.log(`name: ${record.name}, age: ${record.age}`);
    });

    console.warn('------------[SELECT * FROM users ORDER BY age ASC, name DESC;]------------')  
    const resultsOrderedMulti = db.select('users', {}, 'AND', [], [
                                        { column: 'age', order: 'ASC' },
                                        { column: 'name', order: 'DESC' }
                                    ]);
    resultsOrderedMulti.forEach(record => {
        console.log(`name: ${record.name}, age: ${record.age}`);
    });

    console.warn('---------[SELECT * FROM users WHERE age = 25]---------------')

    const resultsWhere = db.select('users', { age: 25 });
    resultsWhere.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, age: ${record.age}`);
    });
    // Output:
    // {id: 2, name: 'Ana', email: 'ana@example.com', age: 25}
    // {id: 3, name: 'Michael', email: 'mmm@example.com', age: 25}

    console.warn('---------[SELECT * FROM users WHERE age = 25 OR  like "%na%"]---------------')
    // const resultsWherelike = db.select('users', { name: { $like: 'na' },age: 30}, 'AND');
    const resultsWherelike = db.select('users', { name: { $like: 'na' },age: 25}, 'OR');
    resultsWherelike.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}, age: ${record.age}`);
    });
    // Output:
    // {id: 2, name: 'Ana', email: 'ana@example.com', age: 25}
    // {id: 4, Name: Milena, email: mile@example.com, age: 30}
    // {id: 3, name: 'Michael', email: 'mmm@example.com', age: 25}
    console.warn(`---------[
        SELECT COUNT(*) AS total, AVG(age) AS avgAge, MAX(age) AS maxAge , MIN(age) AS minAge , SUM(age) AS sumAge
        FROM users 
        WHERE name like "jo"; 
        ]---------------`)

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
    // console.log(resultsAggregate);
    const result = resultsAggregate;
    console.log(`Total: ${result.total}, Promedio: ${result.avgAge}, Máximo: ${result.maxAge}, Mínimo: ${result.minAge}, Suma de edades: ${result.sumAge}`);

    console.warn('---------[ SELECT MIN(name) as firstAlphabetical FROM users  ]---------------')
    
    const resultsAggregate2 = db.selectAggregate('users', {
        aggregate: { 
            firstAlphabetical: 'MIN(name)',
            lastAlphabetical: 'MAX(name)'
        }
    });
    // console.log(resultsAggregate2);
    console.log(`Primer nombre alfabéticamente: ${resultsAggregate2.firstAlphabetical} | Último nombre alfabéticamente: ${resultsAggregate2.lastAlphabetical}`);
                
    console.warn('---------[delete id 3 ]---------------')
    db.delete('users', { id: 3 });
    // console.log(db.select('users'));
    const results2 = db.select('users');
    results2.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Email: ${record.email}`);
    });
     // Output:
    // {id: 1, name: 'Jorge', email: 'jorge@example.com', age: 30}
    // {id: 2, name: 'Ana', email: 'ana@example.com', age: 25}
    // {id: 4, Name: Milena, email: mile@example.com, age: 30}

    console.warn('---------[UPDATE users SET age = 35 WHERE name = "Jorge"]---------------');
    const updatedRows = db.update('users', { name: 'Jorge' }, { age: 35 });
    console.warn(`Registros actualizados: ${updatedRows}`);

    // Verificamos el cambio
    const resultsUpdated = db.select('users');
    resultsUpdated.forEach(record => {
        console.log(`User ID: ${record.id}, Name: ${record.name}, Age: ${record.age}`);
    });


});

db3.load().then(() => {
    // Crear tablas con estructura clara
    db3.createTable('clientes', ['nombre', 'pais'], 'nombre'); // Campo único: id
    db3.createTable('pedidos', ['clienteId', 'producto', 'cantidad'], 'producto');

    // Insertar datos  de prueba
    const dato1 = db3.insert('clientes', { nombre: 'Ana', pais:"México" }, false,[false]);// false en [] como [false] es para no mostrar mensaje de error en consola, pero si retorna este mensaje.
    console.log(dato1);

    // Insertar datos
    db3.MultipleInsert('clientes', [
        { nombre: "Luis", pais: "España" },
        { nombre: "Marta", pais: "Argentina" }, // Cliente sin pedidos
        { nombre: "Carlos", pais: "Colombia" }
    ]);

    db3.MultipleInsert('pedidos', [
        { id: 101, clienteId: 1, producto: "Laptop", cantidad: 2 },
        { id: 102, clienteId: 2, producto: "Mouse", cantidad: 5 },
        { id: 103, clienteId: 1, producto: "Teclado", cantidad: 3 },
        { id: 104, clienteId: 5, producto: "Monitor", cantidad: 1 }, // Pedido sin cliente
        { id: 105, clienteId: 2, producto: "USB", cantidad: 10 }
    ]);


    const result1 = db3.select('clientes');
    const result2 = db3.select('pedidos');

    console.info('------[OTRA BASE DE DATOS]-------')
    console.warn('-----------[tabla 1]-------------')
    // console.log(result);
    result1.forEach(record => {
        console.log(`id: ${record.id}, nombre: ${record.nombre}, pais: ${record.pais}`);
    });
    console.warn('----------[tabla 2]--------------')
    result2.forEach(record => {
        console.log(`id: ${record.id}, clienteId: ${record.clienteId}, product: ${record.producto}, cantidad: ${record.cantidad}`);
    });

    // 1. INNER JOIN: Solo coincidencias exactas
    const inner = db3.join({
        type: "INNER",
        table1: "clientes",
        table2: "pedidos",
        on: { "clientes.id": "pedidos.clienteId" }
    });

    console.warn("----- INNER JOIN -----");
    inner.forEach(r => console.log(
        `Cliente: ${r['clientes.nombre']} (${r['clientes.pais']}) | ` +
        `Pedido: ${r['pedidos.producto']} x${r['pedidos.cantidad']}`
    ));

    // 2. LEFT JOIN: Todos los clientes + pedidos (aunque no tengan)
    const left = db3.join({
        type: "LEFT",
        table1: "clientes",
        table2: "pedidos",
        on: { "clientes.id": "pedidos.clienteId" }
    });

    console.warn("\n----- LEFT JOIN -----");
    left.forEach(r => console.log(
        `Cliente: ${r['clientes.nombre']} | ` +
        `Pedido: ${r['pedidos.producto'] || 'Ninguno'}`
    ));

    // 3. RIGHT JOIN: Todos los pedidos + clientes (aunque no existan)
    const right = db3.join({
        type: "RIGHT",
        table1: "clientes",
        table2: "pedidos",
        on: { "clientes.id": "pedidos.clienteId" }
    });

    console.warn("\n----- RIGHT JOIN -----");
    right.forEach(r => console.log(
        `Pedido: ${r['pedidos.producto']} | ` +
        `Cliente: ${r['clientes.nombre'] || 'Desconocido'}`
    ));

    // 4. FULL JOIN: Combinación completa
    const full = db3.join({
        type: "FULL",
        table1: "clientes",
        table2: "pedidos",
        on: { "clientes.id": "pedidos.clienteId" }
    });

    console.warn("\n----- FULL JOIN -----");
    full.forEach(r => console.log(
        `Cliente: ${r['clientes.nombre'] || '--'} | ` +
        `Pedido: ${r['pedidos.producto'] || '--'}`
    ));



});