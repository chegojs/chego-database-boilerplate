"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const chego_tools_1 = require("@chego/chego-tools");
const replaceScheme = (scheme, table) => (list, row) => {
    const rowScheme = Object.keys(row);
    const content = scheme.reduce((result, prop, i) => {
        const key = rowScheme[i];
        return Object.assign(result, { [prop]: row[key] });
    }, {});
    list.push(utils_1.newRow({ table, scheme, content, key: '' }));
    return list;
};
const getPropertyLabel = (list, property) => (list.push(chego_tools_1.getLabel(property)), list);
const getDefaultScheme = (queryContext, queryResult) => {
    const defaultTable = queryContext.tables[0];
    return (queryContext.data.length)
        ? queryContext.data.reduce(getPropertyLabel, [])
        : queryResult.get(chego_tools_1.getLabel(defaultTable))[0].scheme;
};
const isInResults = (toCompare, results) => {
    let result = false;
    results.forEach((rows) => {
        result = rows.reduce((is, row) => {
            Object.values(row.content).forEach((value) => {
                if (value === toCompare) {
                    is = true;
                }
            });
            return is;
        }, false);
    });
    return result;
};
const selectDistinctValues = (results, res, union) => {
    const data = union.data.getData();
    for (const table of Object.keys(data)) {
        const rows = data[table];
        rows.forEach((row, i) => {
            Object.keys(row).forEach((key) => {
                if (isInResults(row[key], results)) {
                    delete row[key];
                }
            });
            if (Object.keys(row).length === 0) {
                rows.splice(i, 1);
            }
        });
    }
    return Object.assign(res, data);
};
const combineResults = (results) => (res, union) => union.distinct
    ? selectDistinctValues(results, res, union)
    : Object.assign(res, union.data.getData());
const checkIfDistinct = (result, union) => union.distinct ? true : result;
const newUniqueValues = (scheme) => {
    const entries = scheme.reduce((map, key) => (map.push([key, []]), map), []);
    return new Map(entries);
};
const filterUniqueResults = (scheme, uniqueValuesMap) => (row) => {
    for (const key of scheme) {
        const uniqueValues = uniqueValuesMap.get(key);
        const value = row.content[key];
        if (uniqueValues.indexOf(row.content[key]) === -1) {
            uniqueValues.push(value);
            return true;
        }
        else {
            return false;
        }
    }
};
exports.storeOnlyUniqueEntriesIfRequired = (queryContext) => (queryResult) => {
    const storeOnlyUnique = queryContext.unions.reduce(checkIfDistinct, false);
    if (storeOnlyUnique) {
        const defaultTable = queryContext.tables[0];
        const defaultLabel = chego_tools_1.getLabel(defaultTable);
        const scheme = (queryContext.data.length)
            ? queryContext.data.reduce(getPropertyLabel, [])
            : queryResult.get(defaultLabel)[0].scheme;
        const rows = queryResult.get(defaultLabel).filter(filterUniqueResults(scheme, newUniqueValues(scheme)));
        queryResult.set(defaultLabel, rows);
    }
    return queryResult;
};
exports.applyUnionsIfAny = (queryContext) => (queryResult) => {
    if (queryContext.unions.length) {
        const defaultTable = queryContext.tables[0];
        const defaultLabel = chego_tools_1.getLabel(defaultTable);
        const scheme = getDefaultScheme(queryContext, queryResult);
        const union = queryContext.unions.reduce(combineResults(queryResult), {});
        for (const table of Object.keys(union)) {
            const rows = union[table].reduce(replaceScheme(scheme, defaultTable), []);
            if (queryResult.has(defaultLabel)) {
                queryResult.get(defaultLabel).push(...rows);
            }
            else {
                queryResult.set(defaultLabel, rows);
            }
        }
    }
    return queryResult;
};
exports.newUnion = (distinct, data) => ({ distinct, data });
//# sourceMappingURL=unions.js.map