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

    select(tableName, whereClause = {}) {
        if (this.tables[tableName]) {
            return this.tables[tableName].records.filter(record => {
                return Object.keys(whereClause).every(key => record[key] === whereClause[key]);
            });
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