"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_tools_1 = require("@chego/chego-tools");
const chego_api_1 = require("@chego/chego-api");
exports.createEmptyObject = (keys) => keys.reduce((acc, c) => { acc[c] = null; return acc; }, {});
exports.newDataMap = (iterable) => new Map(iterable);
exports.newRow = ({ table = null, key = '', scheme = [], content = {} }) => ({
    table, key, scheme, content
});
exports.parseStringToSortingOrderEnum = (value) => {
    const order = value && value.toUpperCase();
    return order
        ? chego_api_1.SortingOrderEnum[order] ? chego_api_1.SortingOrderEnum[order] : chego_api_1.SortingOrderEnum.ASC
        : chego_api_1.SortingOrderEnum.ASC;
};
exports.isQueryResult = (value) => value && value.getData !== undefined;
exports.basicSort = (a, b, direction) => direction * ((a < b) ? -1 : (a > b) ? 1 : 0);
exports.isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);
exports.newUnion = (distinct, data) => ({ distinct, data });
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
//# sourceMappingURL=utils.js.map