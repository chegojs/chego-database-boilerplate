"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const chego_api_1 = require("@chego/chego-api");
const chego_tools_1 = require("@chego/chego-tools");
const queryProcessingUtils_1 = require("./queryProcessingUtils");
exports.newJoin = (type, property) => ({ type, propertyB: property, propertyA: chego_tools_1.newProperty({}) });
exports.newJoinBuilder = (type, tableA, tableB) => {
    const propA = chego_tools_1.newProperty({});
    const propB = chego_tools_1.newProperty({});
    const builder = {
        withOn: (first, second) => {
            Object.assign(propA, first);
            Object.assign(propB, second);
            return builder;
        },
        using: (property) => {
            Object.assign(propA, property, { table: tableA });
            Object.assign(propB, property, { table: tableB });
            return builder;
        },
        build: () => ({ type, propertyA: propA, propertyB: propB })
    };
    return builder;
};
const combineRows = (rowA, rowB) => {
    const content = Object.assign({}, rowA.content);
    for (const key in rowB.content) {
        if (content[key]) {
            content[`${rowB.table.name}.${key}`] = rowB.content[key];
        }
        else {
            content[key] = rowB.content[key];
        }
    }
    return { table: rowA.table, key: rowA.key, content, scheme: Object.keys(content) };
};
const shouldJoinRows = (rowA, rowB, join) => {
    const a = (chego_tools_1.isRowId(join.propertyA)) ? rowA.key : rowA.content[chego_tools_1.getLabel(join.propertyA)];
    const b = (chego_tools_1.isRowId(join.propertyB)) ? rowB.key : rowB.content[chego_tools_1.getLabel(join.propertyB)];
    return (utils_1.isNumeric(a) && utils_1.isNumeric(b)) ? Number(a) === Number(b) : a === b;
};
const doSideJoin = (rowsA, rowsB, join) => {
    const combinedRows = [];
    const initRow = rowsB[0];
    const scheme = Object.keys(initRow.content);
    const emptyRow = utils_1.newRow({
        table: initRow.table,
        key: initRow.key,
        scheme,
        content: utils_1.createEmptyObject(scheme)
    });
    let rowToAssign;
    rowsA.forEach((rowA) => {
        rowToAssign = emptyRow;
        rowsB.forEach((rowB) => {
            if (shouldJoinRows(rowA, rowB, join)) {
                rowToAssign = rowB;
            }
        });
        combinedRows.push(combineRows(rowA, rowToAssign));
    });
    return combinedRows;
};
const doLeftJoin = (rowsA, rowsB, join) => doSideJoin(rowsA, rowsB, join);
const doRightJoin = (rowsA, rowsB, join) => doSideJoin(rowsB, rowsA, join);
const doJoin = (rowsA, rowsB, join) => {
    const combinedRows = [];
    rowsA.forEach((rowA) => {
        rowsB.forEach((rowB) => {
            if (shouldJoinRows(rowA, rowB, join)) {
                combinedRows.push(combineRows(rowA, rowB));
            }
        });
    });
    return combinedRows;
};
const doFullJoin = (rowsA, rowsB, join) => {
    const leftJoin = doSideJoin(rowsA, rowsB, join);
    const rightJoin = doSideJoin(rowsB, rowsA, join);
    return [...leftJoin, ...rightJoin];
};
const joinFunctions = new Map([
    [chego_api_1.QuerySyntaxEnum.Join, doJoin],
    [chego_api_1.QuerySyntaxEnum.FullJoin, doFullJoin],
    [chego_api_1.QuerySyntaxEnum.LeftJoin, doLeftJoin],
    [chego_api_1.QuerySyntaxEnum.RightJoin, doRightJoin]
]);
exports.mergeTableB2TableA = (join, results) => (tableBContent) => {
    const rowsA = results.get(join.propertyA.table.name);
    const rowsB = queryProcessingUtils_1.parseDataSnapshotToRows(join.propertyB.table, tableBContent);
    const joinFn = joinFunctions.get(join.type);
    const combinedRows = joinFn ? joinFn(rowsA, rowsB, join) : [];
    results.set(join.propertyA.table.name, combinedRows);
    return results;
};
//# sourceMappingURL=joins.js.map