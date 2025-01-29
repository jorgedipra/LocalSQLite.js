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
    
        const table = this.tables[tableName];
    
        // Inicializar índice si no existe
        if (!table.indexes) {
            table.indexes = {};
        }
    
        if (!table.indexes[field]) {
            table.indexes[field] = {};
    
            // Poblar el índice con registros existentes
            for (const record of table.records) {
                const value = record[field];
                if (value !== undefined) {
                    if (!table.indexes[field][value]) {
                        table.indexes[field][value] = [];
                    }
                    table.indexes[field][value].push(record);
                }
            }
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

    insert(tableName, record) {
        if (!this.tables[tableName]) {
            console.error(`Table ${tableName} does not exist.`);
            return;
        }
    
        const table = this.tables[tableName];
        const uniqueField = table.uniqueField;
    
        // Validar la unicidad del campo uniqueField (si existe)
        if (uniqueField && record[uniqueField] && !this.isUnique(tableName, uniqueField, record[uniqueField])) {
            console.error(`Error: El valor del campo '${uniqueField}' (${record[uniqueField]}) ya existe.`);
            return;
        }
    
        // Generar un ID único
        const id = this.generateUniqueId(tableName);
        const recordWithId = { id, ...record };
    
        // Insertar el registro en la tabla
        table.records.push(recordWithId);
    
        // Inicializar índices si no existen
        if (!table.indexes) {
            table.indexes = {};
        }
    
        // Si hay índices en la tabla, actualizarlos
        for (const field in table.indexes) {
            const value = recordWithId[field];
            if (value !== undefined) {
                if (!table.indexes[field]) {
                    table.indexes[field] = {};
                }
                if (!table.indexes[field][value]) {
                    table.indexes[field][value] = [];
                }
                table.indexes[field][value].push(recordWithId);
            }
        }
    
        this.save();
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
    join(table1, table2, field1, field2) {
        if (this.tables[table1] && this.tables[table2]) {
            const records1 = this.tables[table1].records || [];
            const records2 = this.tables[table2].records || [];

            // Realizar el JOIN entre las dos tablas
            const result = [];
            for (const record1 of records1) {
                for (const record2 of records2) {
                    if (record1[field1] === record2[field2]) {
                        result.push({ ...record1, ...record2 });
                    }
                }
            }

            return result;
        } else {
            console.error(`Una o ambas tablas (${table1}, ${table2}) no existen.`);
            return [];
        }
    }

}