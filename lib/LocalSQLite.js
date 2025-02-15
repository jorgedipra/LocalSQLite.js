/*!
 * LocalSQLite JavaScript Library v1.0
 *
 * MPL-2.0 license
 * Mozilla Public License Version 2.0
 *
 * Date: 2025-01-27
 */
class DBEngine {
    constructor(dbName = 'defaultDB') {
        this.dbName = dbName; // Nombre dinámico de la base de datos
        this.tables = {};
        this.indexes = {}; // Almacena los índices para optimización
    }
    async load() {
        this.tables = JSON.parse(localStorage.getItem(this.dbName) || '{}');
        this.indexes = JSON.parse(localStorage.getItem(this.dbName + '_indexes') || '{}');
    }

    save() {
        localStorage.setItem(this.dbName, JSON.stringify(this.tables));
        localStorage.setItem(this.dbName + '_indexes', JSON.stringify(this.indexes));
    }

    createTable(tableName, fields, uniqueField = null) {

        if (!this.tables[tableName]) {
            // Crear una nueva tabla con los campos y un campo único.
            this.tables[tableName] = {
                fields: fields, // Los campos de la tabla
                uniqueField: uniqueField || null, // El campo único (si no se especifica, se deja null)
                records: [], // Los registros de la tabla
                indexes: {}
            };
            this.indexes[tableName] = {}; // Inicializar índices
            this.save();
        }
    }

    createIndex(tableName, field) {
        if (!this.tables[tableName]) {
            console.error(`Table ${tableName} does not exist.`);
            return;
        }
    
        // Inicializar índices de la tabla si no existen
        if (!this.indexes[tableName]) {
            this.indexes[tableName] = {};
        }
    
        const tableIndexes = this.indexes[tableName];
    
        // Crear índice solo si no existe
        if (!tableIndexes[field]) {
            tableIndexes[field] = {};
    
            // Poblar el índice con registros actuales
            const tableRecords = this.tables[tableName].records;
            for (const record of tableRecords) {
                const value = record[field];
                if (value !== undefined) {
                    if (!tableIndexes[field][value]) {
                        tableIndexes[field][value] = [];
                    }
                    tableIndexes[field][value].push(record);
                }
            }
    
            this.save();
        }
    }
    

    generateUniqueId(tableName) {
        const existingIds = this.tables[tableName].records.map(record => record.id);
        let newId = 1;
        while (existingIds.includes(newId)) {
            newId++;
        }
        return newId;
    }

    isUnique(tableName, field, value) {
        if (!this.tables[tableName].uniqueField) return true; // Si no hay campo único, no valida
        return !this.tables[tableName].records.some(record => record[field] === value);
    }

    insert(tableName, record, autoSave = true, msnReturn=[true]) {
        if (!this.tables[tableName]) {
            console.error(`Table ${tableName} does not exist.`);
            return;
        }
    
        const table = this.tables[tableName];
        const uniqueField = table.uniqueField;

        // Validar campo único
        if (uniqueField && record[uniqueField]) {
            const existingRecords = table.records;
            const valueToCheck = record[uniqueField];
            
            // Verificar si el valor ya existe (comparación estricta)
            const isDuplicate = existingRecords.some(r => {
                return r[uniqueField] === valueToCheck;
            });

            if (isDuplicate) {
                if (Array.isArray(msnReturn) && msnReturn.length > 0 && msnReturn[0] === true)
                console.error(`Error: ${uniqueField} '${valueToCheck}' ya existe.`);
                return ["Error: "+ uniqueField +" "+ valueToCheck+" ya existe"];
            }
        }
    
        // Generar ID único
        const id = this.generateUniqueId(tableName);
        const recordWithId = { id, ...record };
    
        // Insertar registro en la tabla
        table.records.push(recordWithId);
    
        // Actualizar los índices en this.indexes (si existen)
        if (this.indexes[tableName]) {
            for (const field of Object.keys(this.indexes[tableName])) {
                const value = recordWithId[field];
                if (value !== undefined) {
                    const fieldIndex = this.indexes[tableName][field];
                    if (!fieldIndex[value]) {
                        fieldIndex[value] = [];
                    }
                    // Verificar si el registro ya está en el índice
                    const exists = fieldIndex[value].some(r => r.id === recordWithId.id);
                    if (!exists) {
                        fieldIndex[value].push(recordWithId);
                    }
                }
            }
        }
    
        if (autoSave) {
            this.save();
        }
    }

    MultipleInsert(tableName, records) { //Método para inserción múltiple
        if (!Array.isArray(records)) {
            console.error("Debe proporcionar un array de registros.");
            return;
        }
        var mnsReturn = ""; // Mensaje de retorno
        var messages = []; // Array para acumular los mensajes
        records.forEach(record => {
            mnsReturn = this.insert(tableName, record, false,[false]); // AutoSave desactivado
            messages.push(mnsReturn); // Guardar el mensaje en el array
        });
        

        this.save();
        return messages.join('\n'); // Retornar el lote de mensajes como una sola cadena

    }
    
    

    select(tableName, whereClause = {}, operator = 'AND', columns = [], orderBy = [], distinctColumns = []) {
        if (!this.tables[tableName]) {
            console.error(`Table ${tableName} does not exist.`);
            return [];
        }
    
        const isAndOperator = operator === 'AND';
        let filteredRecords = [];
    
        // Verifica si algún campo del whereClause tiene un índice
        const indexedField = Object.keys(whereClause).find(field => this.tables[tableName].indexes?.[field]);
    
        if (indexedField) {
            // Si hay un índice, usarlo para acceder directamente a los registros filtrados
            const value = whereClause[indexedField];
            filteredRecords = this.tables[tableName].indexes[indexedField][value] || [];
        } else {
            // Si no hay índice, hacer la búsqueda normal recorriendo todos los registros
            filteredRecords = this.tables[tableName].records.filter(record => {
                const conditions = Object.keys(whereClause).map(key => {
                    const value = whereClause[key];
    
                    // Soporte para búsqueda parcial con `$like`
                    if (value && typeof value === 'object' && value.$like) {
                        const pattern = new RegExp(value.$like, 'i'); // i = case-insensitive
                        return pattern.test(record[key]);
                    }
    
                    return record[key] === value; // Comparación exacta por defecto
                });
    
                return isAndOperator ? conditions.every(Boolean) : conditions.some(Boolean);
            });
        }
    
        // Seleccionar solo las columnas especificadas
        let result = columns.length > 0
            ? filteredRecords.map(record => {
                const selected = {};
                columns.forEach(column => {
                    if (record.hasOwnProperty(column)) {
                        selected[column] = record[column];
                    }
                });
                return selected;
            })
            : filteredRecords;
    
        // Aplicar DISTINCT si se especifican columnas para eliminar duplicados
        if (distinctColumns.length > 0) {
            const seenValues = new Set();
            result = result.filter(record => {
                const key = distinctColumns.map(col => record[col]).join('|');
                if (seenValues.has(key)) return false;
                seenValues.add(key);
                return true;
            });
        }
    
        // Ordenar resultados si se especifica orderBy
        if (orderBy.length > 0) {
            result.sort((a, b) => {
                for (let { column, order } of orderBy) {
                    if (a[column] < b[column]) return order === 'ASC' ? -1 : 1;
                    if (a[column] > b[column]) return order === 'ASC' ? 1 : -1;
                }
                return 0;
            });
        }
    
        return result;
    }

    //Agregación (COUNT, SUM, AVG, MIN, MAX)
   selectAggregate(tableName, options = {}) {
    if (!this.tables[tableName]) {
        console.error(`Table ${tableName} does not exist.`);
        return {};
    }

    const filteredRecords = this.select(
        tableName,
        options.where || {},
        options.operator || 'AND'
    );

    const aggregates = options.aggregate || {};
    const result = {};

    for (const [alias, operation] of Object.entries(aggregates)) {
        const [func, field] = operation.split(/\(|\)/).filter(Boolean);
        const normalizedFunc = func.trim().toUpperCase();
        const normalizedField = field ? field.trim() : null;

        let value;

        switch (normalizedFunc) {
            case 'COUNT':
                value = normalizedField === '*' || !normalizedField 
                    ? filteredRecords.length 
                    : filteredRecords.filter(r => r[normalizedField] !== undefined).length;
                break;

            case 'SUM':
                value = filteredRecords.reduce((acc, r) => {
                    const num = Number(r[normalizedField]);
                    return isNaN(num) ? acc : acc + num;
                }, 0);
                break;

            case 'AVG':
                const validRecords = filteredRecords
                    .map(r => Number(r[normalizedField]))
                    .filter(n => !isNaN(n));
                value = validRecords.length 
                    ? validRecords.reduce((a, b) => a + b, 0) / validRecords.length 
                    : 0;
                break;

            case 'MIN': {
                const values = filteredRecords
                    .map(r => r[normalizedField])
                    .filter(v => v !== undefined && v !== null);

                if (values.length === 0) {
                    value = 0;
                    break;
                }

                // Verificar si los valores son numéricos
                const numericValues = values.map(v => Number(v)).filter(n => !isNaN(n));
                if (numericValues.length > 0) {
                    value = Math.min(...numericValues);
                } else {
                    // Ordenar alfabéticamente y tomar el primero
                    const sorted = values.sort((a, b) => a.localeCompare(b));
                    value = sorted[0];
                }
                break;
            }

            case 'MAX': {
                const values = filteredRecords
                    .map(r => r[normalizedField])
                    .filter(v => v !== undefined && v !== null);

                if (values.length === 0) {
                    value = 0;
                    break;
                }

                const numericValues = values.map(v => Number(v)).filter(n => !isNaN(n));
                if (numericValues.length > 0) {
                    value = Math.max(...numericValues);
                } else {
                    const sorted = values.sort((a, b) => a.localeCompare(b));
                    value = sorted[sorted.length - 1];
                }
                break;
            }

            default:
                console.error(`Función no soportada: ${normalizedFunc}`);
                value = null;
        }

        result[alias] = value;
    }

    return result;
}
    

    delete(tableName, whereClause = {}) {
        if (this.tables[tableName]) {
            this.tables[tableName].records = this.tables[tableName].records.filter(record => {
                return !Object.keys(whereClause).every(key => record[key] === whereClause[key]);
            });
            this.save();
        } else {
            console.error(`Table ${tableName} does not exist.`);
        }
    }


    update(tableName, whereClause, newValues) {
        if (!this.tables[tableName]) {
            console.error(`Table ${tableName} does not exist.`);
            return 0;
        }

        let updatedCount = 0;
        this.tables[tableName].records = this.tables[tableName].records.map(record => {
            // Verificar si el registro cumple con las condiciones del whereClause
            const match = Object.keys(whereClause).every(key => record[key] === whereClause[key]);

            if (match) {
                updatedCount++;
                const updatedRecord = { ...record, ...newValues };  // Actualizamos el registro con los nuevos valores

                // Actualizamos el registro en memoria
                return updatedRecord;
            }
            return record;
        });

        // Si se realizaron actualizaciones, se actualiza el localStorage
        if (updatedCount > 0) {
            this.save();  // Guardamos todas las tablas en localStorage
            console.log(`${updatedCount} record(s) updated in ${tableName}`);
        } else {
            console.log(`No records were updated in ${tableName}.`);
        }

        return updatedCount;  // Retornamos la cantidad de registros actualizados
    }


    // Método para realizar un JOIN básico
    join(options = {}) {
        const {
            type = "INNER", // INNER, LEFT, RIGHT, FULL
            table1,
            table2,
            on // Ej: { "users.id": "orders.userId" }
        } = options;

        // Validar existencia de tablas
        if (!this.tables[table1] || !this.tables[table2]) {
            console.error(`Tablas "${table1}" o "${table2}" no existen.`);
            return [];
        }

        // Extraer campos de la cláusula ON
        const [table1Field, table2Field] = Object.entries(on)[0] || [];
        const [table1Name, field1] = table1Field?.split('.') || [];
        const [table2Name, field2] = table2Field?.split('.') || [];

        // Validar formato del ON
        if (!field1 || !field2) {
            console.error('Formato incorrecto en ON. Usar "tabla.campo".');
            return [];
        }

        const records1 = this.tables[table1].records;
        const records2 = this.tables[table2].records;
        const result = [];

        // Función para agregar prefijos a los campos
        const prefixFields = (record, table) => {
            const prefixed = {};
            for (const key in record) {
                prefixed[`${table}.${key}`] = record[key];
            }
            return prefixed;
        };

        // Lógica para cada tipo de JOIN
        switch (type.toUpperCase()) {
            case "INNER": {
                for (const record1 of records1) {
                    const matches = records2.filter(record2 =>
                        record1[field1] === record2[field2]
                    );
                    for (const match of matches) {
                        result.push({
                            ...prefixFields(record1, table1),
                            ...prefixFields(match, table2)
                        });
                    }
                }
                break;
            }

            case "LEFT": {
                for (const record1 of records1) {
                    const matches = records2.filter(record2 =>
                        record1[field1] === record2[field2]
                    );
                    if (matches.length > 0) {
                        for (const match of matches) {
                            result.push({
                                ...prefixFields(record1, table1),
                                ...prefixFields(match, table2)
                            });
                        }
                    } else {
                        // Crear objeto con campos null para tabla2
                        const nullRecord = this.tables[table2].fields.reduce((acc, field) => {
                            acc[`${table2}.${field}`] = null;
                            return acc;
                        }, {});
                        result.push({
                            ...prefixFields(record1, table1),
                            ...nullRecord
                        });
                    }
                }
                break;
            }

            case "RIGHT": {
                for (const record2 of records2) {
                    const matches = records1.filter(record1 =>
                        record1[field1] === record2[field2]
                    );
                    if (matches.length > 0) {
                        for (const match of matches) {
                            result.push({
                                ...prefixFields(match, table1),
                                ...prefixFields(record2, table2)
                            });
                        }
                    } else {
                        // Crear objeto con campos null para tabla1
                        const nullRecord = this.tables[table1].fields.reduce((acc, field) => {
                            acc[`${table1}.${field}`] = null;
                            return acc;
                        }, {});
                        result.push({
                            ...nullRecord,
                            ...prefixFields(record2, table2)
                        });
                    }
                }
                break;
            }

            case "FULL": {
                const left = this.join({ ...options, type: "LEFT" });
                const right = this.join({ ...options, type: "RIGHT" });
                const combined = [...left, ...right];
                // Eliminar duplicados usando un identificador único
                const unique = combined.filter((record, index, self) =>
                    index === self.findIndex(r => 
                        JSON.stringify(r) === JSON.stringify(record)
                    )
                );
                result.push(...unique);
                break;
            }

            default:
                console.error(`Tipo de JOIN no soportado: ${type}`);
        }

        return result;
    }

    /**
         * Exporta toda la base de datos (tablas e índices) a un objeto JSON.
         * @returns {Object} Datos de la base de datos en formato { tables, indexes }.
         */
    exportDB() {
        return {
            tables: JSON.parse(JSON.stringify(this.tables)), // Copia profunda
            indexes: JSON.parse(JSON.stringify(this.indexes))
        };
    }

    /**
     * Restaura la base de datos desde un objeto JSON.
     * @param {Object} data - Datos en formato { tables, indexes }.
     */
    importDB(data) {
        // Validar formato básico
        if (!data || typeof data !== 'object' || !data.tables || !data.indexes) {
            throw new Error("Formato de datos inválido para importar.");
        }

        // Reemplazar datos actuales
        this.tables = JSON.parse(JSON.stringify(data.tables));
        this.indexes = JSON.parse(JSON.stringify(data.indexes));

        // Persistir en localStorage
        this.save();
    }


}//Fin de la clase DBEngine