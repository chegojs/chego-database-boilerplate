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
const pickRepresentative = (by) => (list, current) => {
    const previous = list[list.length - 1];
    if (!previous || (previous && previous[by] !== current[by])) {
        list.push(current);
    }
    return list;
};
exports.groupResultsIfRequired = (queryContext) => (data) => {
    const groupByLength = queryContext.groupBy.length;
    if (groupByLength) {
        const result = {};
        Object.keys(data).forEach((tableName) => {
            const by = queryContext.groupBy[groupByLength - 1].property.name;
            const groupedRows = data[tableName].sort(compareUsing(queryContext.groupBy)).reduce(pickRepresentative(by), []);
            Object.assign(result, { [tableName]: groupedRows });
        });
        return result;
    }
    return data;
};
//# sourceMappingURL=groupBy.js.map