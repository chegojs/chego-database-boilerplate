"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_api_1 = require("@chego/chego-api");
const parseMin = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let min = rows[0].content[keyName];
    if (!min) {
        return rows;
    }
    const result = rows[0]; /*clone(rows[0]);*/
    rows.forEach((row) => {
        if (row.content[keyName] < min) {
            min = row.content[keyName];
        }
    });
    delete result.content[keyName];
    result.content[fnData.alias] = min;
    return [result];
};
const parseMax = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let max = rows[0].content[keyName];
    if (!max) {
        return rows;
    }
    const result = rows[0]; /*clone(rows[0]);*/
    rows.forEach((row) => {
        if (row.content[keyName] > max) {
            max = row.content[keyName];
        }
    });
    delete result.content[keyName];
    result.content[fnData.alias] = max;
    return [result];
};
const parseCount = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    const result = rows[0]; /*clone(rows[0]);*/
    delete result.content[keyName];
    result.content[fnData.alias] = rows.length;
    return [result];
};
const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);
const parseSum = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let sum = 0;
    let field;
    const result = rows[0]; /*clone(rows[0]);*/
    rows.forEach((row) => {
        field = row.content[keyName];
        if (isNumeric(field)) {
            sum += field;
        }
    });
    delete result.content[keyName];
    result.content[fnData.alias] = sum;
    return [result];
};
const parseAvg = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let sum = 0;
    let field;
    const result = rows[0]; /*clone(rows[0]);*/
    rows.forEach((row) => {
        field = row.content[keyName];
        if (isNumeric(field)) {
            sum += field;
        }
    });
    delete result.content[keyName];
    result.content[fnData.alias] = sum / rows.length;
    return [result];
};
const parsePow = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let field;
    rows.forEach((row) => {
        field = row.content[keyName];
        row.content[fnData.alias] = isNumeric(field) ? Math.pow(field, fnData.exponent) : 0;
        delete row.content[keyName];
    });
    return rows;
};
const parseSqrt = (rows, fnData) => {
    const keyName = fnData.properties[0].name;
    let field;
    rows.forEach((row) => {
        field = row.content[keyName];
        row.content[fnData.alias] = isNumeric(field) ? Math.sqrt(field) : 0;
        delete row.content[keyName];
    });
    return rows;
};
const parseLeast = (rows, fnData) => {
    return rows.reduce((acc, row) => {
        let min = row.content[fnData.properties[0].name];
        min = fnData.properties.reduce((acc, tdk) => {
            if (row.content[tdk.name] < min) {
                acc = row.content[tdk.name];
            }
            return acc;
        }, min);
        // remove origins
        row.content[fnData.alias] = min;
        acc.push(row);
        return acc;
    }, []);
};
const parseGreatest = (rows, fnData) => {
    return rows.reduce((acc, row) => {
        let max = row.content[fnData.properties[0].name];
        max = fnData.properties.reduce((acc, tdk) => {
            if (row.content[tdk.name] > max) {
                acc = row.content[tdk.name];
            }
            return acc;
        }, max);
        // remove origins
        row.content[fnData.alias] = max;
        acc.push(row);
        return acc;
    }, []);
};
const parseCoalesce = (rows, fnData) => {
    return rows.reduce((acc, row) => {
        let result = null;
        for (const property of fnData.properties) {
            if (row.content[property.name]) {
                result = row.content[property.name];
                break;
            }
        }
        // remove origins
        row.content[fnData.alias] = result;
        acc.push(row);
        return acc;
    }, []);
};
const mysqlFunctions = new Map([
    [chego_api_1.QuerySyntaxEnum.Min, parseMin],
    [chego_api_1.QuerySyntaxEnum.Max, parseMax],
    [chego_api_1.QuerySyntaxEnum.Sum, parseSum],
    [chego_api_1.QuerySyntaxEnum.Sqrt, parseSqrt],
    [chego_api_1.QuerySyntaxEnum.Pow, parsePow],
    [chego_api_1.QuerySyntaxEnum.Avg, parseAvg],
    [chego_api_1.QuerySyntaxEnum.Least, parseLeast],
    [chego_api_1.QuerySyntaxEnum.Greatest, parseGreatest],
    [chego_api_1.QuerySyntaxEnum.Coalesce, parseCoalesce]
]);
const applyMySQLFunctions = (functions, tableName) => (rows, key, map) => {
    let parsedRows = [];
    functions.forEach((fnData) => {
        const mySQLFn = mysqlFunctions.get(fnData.type);
        if (mySQLFn && fnData.properties[0].table.name === (tableName ? tableName : key)) {
            parsedRows = [...parsedRows, ...mySQLFn(rows, fnData)];
        }
    });
    map.set(key, parsedRows);
};
exports.applyMySQLFunctionsIfAny = (queryContext) => (data) => {
    if (queryContext.functions.length) {
        data.forEach(applyMySQLFunctions(queryContext.functions));
    }
    return data;
};
//# sourceMappingURL=mySQLFunctions.js.map