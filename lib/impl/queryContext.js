"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const newQueryResult = () => {
    let result;
    return {
        setData(value) {
            result = value;
        },
        getData() {
            return result;
        }
    };
};
exports.newQueryContext = () => ({
    type: null,
    result: newQueryResult(),
    data: [],
    tables: [],
    joins: [],
    unions: [],
    limit: null,
    orderBy: [],
    groupBy: [],
    functions: [],
    conditions: []
});
//# sourceMappingURL=queryContext.js.map