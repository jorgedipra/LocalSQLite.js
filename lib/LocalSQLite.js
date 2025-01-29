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
    }
    async load() {
            this.tables = JSON.parse(localStorage.getItem(this.dbName) || '{}');
    }

    save() {
            localStorage.setItem(this.dbName, JSON.stringify(this.tables));
    }
    createTable(tableName, fields, uniqueField) {
        if (!this.tables[tableName]) {
            // Crear una nueva tabla con los campos y un campo único.
            this.tables[tableName] = {
                fields: fields, // Los campos de la tabla
                uniqueField: uniqueField || null, // El campo único (si no se especifica, se deja null)
                records: [] // Los registros de la tabla
            };
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

    insert(tableName, record) {
        if (this.tables[tableName]) {
            // Validar la unicidad del campo seleccionado
            const uniqueField = this.tables[tableName].uniqueField;
            if (uniqueField && record[uniqueField] && !this.isUnique(tableName, uniqueField, record[uniqueField])) {
                console.error(`Error: El valor del campo '${uniqueField}' (${record[uniqueField]}) ya existe.`);
                return;
            }

            const id = this.generateUniqueId(tableName);
            // Colocar el ID al principio del objeto
            const recordWithId = { id, ...record };
            this.tables[tableName].records.push(recordWithId);
            this.save();
        } else {
            console.error(`Table ${tableName} does not exist.`);
        }
    }

    select(tableName, whereClause = {}, operator = 'AND', columns = [], orderBy = [], distinctColumns = []) {
        if (this.tables[tableName]) {
            const isAndOperator = operator === 'AND';
    
            // Filtrar los registros según el whereClause
            let filteredRecords = this.tables[tableName].records.filter(record => {
                const conditions = Object.keys(whereClause).map(key => {
                    const value = whereClause[key];
    
                    // Si es un objeto con "$like", realiza la búsqueda parcial
                    if (value && typeof value === 'object' && value.$like) {
                        const pattern = new RegExp(value.$like, 'i'); // i = case-insensitive
                        return pattern.test(record[key]);
                    }
    
                    // Comparación exacta por defecto
                    return record[key] === value;
                });
    
                // Aplica el operador lógico (AND o OR)
                return isAndOperator
                    ? conditions.every(condition => condition)
                    : conditions.some(condition => condition);
            });
    
            // Si se especifican columnas, devolver solo esas columnas
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
                    // Crear una clave única basada en las columnas `distinctColumns`
                    const key = distinctColumns.map(col => record[col]).join('|');
    
                    if (seenValues.has(key)) {
                        return false;
                    }
                    seenValues.add(key);
                    return true;
                });
            }
    
            // Ordenar los resultados si se especifica orderBy con múltiples columnas
            if (orderBy.length > 0) {
                result.sort((a, b) => {
                    for (let { column, order } of orderBy) {
                        if (a[column] < b[column]) return order === 'ASC' ? -1 : 1;
                        if (a[column] > b[column]) return order === 'ASC' ? 1 : -1;
                    }
                    return 0; // Si todos los criterios son iguales, mantiene el orden original
                });
            }
    
            return result;
        }
        console.error(`Table ${tableName} does not exist.`);
        return [];
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