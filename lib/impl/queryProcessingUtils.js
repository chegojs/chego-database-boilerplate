"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_api_1 = require("@chego/chego-api");
const utils_1 = require("./utils");
const templates_1 = require("./templates");
exports.parseRowsToArray = (result, row) => (result.push(Object.assign({}, row.content)), result);
exports.parseRowsToObject = (result, row) => (Object.assign(result, { [row.key]: row.content }), result);
exports.shouldFilterRowContent = (properties) => properties && properties.length > 0 && properties[0].name !== '*';
exports.parseDataSnapshotToRows = (table, data) => {
    const rows = [];
    let content;
    for (const key in data) {
        content = data[key];
        rows.push(utils_1.newRow({
            table,
            key,
            scheme: Object.keys(content),
            content
        }));
    }
    return rows;
};
exports.filterQueryResultsIfRequired = (queryContext) => (queryResult) => {
    const parsedResult = utils_1.newDataMap();
    const select = templates_1.templates.get(chego_api_1.QuerySyntaxEnum.Select);
    let tableRows;
    queryResult.forEach((rows, tableName) => {
        tableRows = rows.filter((row, index) => {
            // if (queryContext.conditions.test(row)) {
            //     if (shouldFilterRowContent(queryContext.data) && queryContext.type === QuerySyntaxEnum.Select) {
            //         row.content = queryContext.data.reduce((content: any, property: Property) => select(property)(content)(row), {});
            //     }
            //     return true;
            // }
            return false;
        });
        parsedResult.set(tableName, tableRows);
    });
    return parsedResult;
};
exports.convertMapToInputData = (tablesMap) => {
    const results = {};
    tablesMap.forEach((rows, table) => {
        Object.assign(results, { [table]: rows.reduce(exports.parseRowsToObject, {}) });
    }, results);
    return results;
};
exports.convertMapToOutputData = (tablesMap) => {
    const results = {};
    tablesMap.forEach((rows, table) => {
        Object.assign(results, { [table]: rows.reduce(exports.parseRowsToArray, []) });
    }, results);
    return results;
};
exports.spliceQueryResultsIfRequired = (limit) => (data) => {
    if (limit) {
        const range = limit.count
            ? [limit.offsetOrCount, limit.count]
            : limit.offsetOrCount < 0
                ? [limit.offsetOrCount]
                : [0, limit.offsetOrCount];
        for (const table of Object.keys(data)) {
            data[table] = data[table].slice(...range);
        }
    }
    return data;
};
const nullifyRows = (rows, row) => [...rows, Object.assign(row, { content: null })];
const nullifyRowsContent = (keysToRemove) => (rows, row) => {
    for (const key of keysToRemove) {
        if (row.scheme.indexOf(key.name) > -1) {
            row.content[key.name] = null;
        }
    }
    return [...rows, row];
};
exports.containsSelectAllShorthand = (properties) => properties.reduce((result, property) => {
    if (property.name === '*') {
        result = true;
    }
    return result;
}, false);
exports.shouldNullifyEntireRows = (properties) => properties.length === 0 || exports.containsSelectAllShorthand(properties);
exports.nullifyData = (properties) => (data) => {
    const action = exports.shouldNullifyEntireRows(properties) ? nullifyRows : nullifyRowsContent(properties);
    data.forEach((rows, table) => {
        const nullifiedData = rows.reduce(action, []);
        data.set(table, nullifiedData);
    });
    return data;
};
exports.withErrorMessage = (errors) => {
    const message = [];
    errors.forEach((error, table) => {
        message.push(`Operation on table "${table}" failed: ${error.message}`);
    });
    return message.join('\n');
};
exports.updateContent = (newContent) => (data) => {
    data.forEach((rows) => {
        rows.map((row) => {
            for (const key of Object.keys(newContent)) {
                row.content[key] = newContent[key];
            }
        });
    });
    return data;
};
//# sourceMappingURL=queryProcessingUtils.js.map