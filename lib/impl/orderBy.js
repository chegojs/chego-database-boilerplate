"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const compareUsing = (sorters) => (a, b) => {
    const sortBy = sorters[0];
    const by = sortBy.property.name;
    const valueA = (typeof a[by] === 'string') ? String(a[by]).toLowerCase() : a[by];
    const valueB = (typeof b[by] === 'string') ? String(b[by]).toLowerCase() : b[by];
    const sortResult = utils_1.basicSort(valueA, valueB, sortBy.order);
    return sortResult === 0 && sorters.length > 1 ? compareUsing(sorters.slice(1))(a, b) : sortResult;
};
exports.orderResultsIfRequired = (queryContext) => (data) => {
    if (queryContext.orderBy.length) {
        Object.keys(data).forEach((tableName) => {
            data[tableName].sort(compareUsing(queryContext.orderBy));
        });
    }
    return data;
};
//# sourceMappingURL=orderBy.js.map