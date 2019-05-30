"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const chego_api_1 = require("@chego/chego-api");
const chego_tools_1 = require("@chego/chego-tools");
exports.getQueryResultValues = (data) => {
    const results = [];
    Object.values(data).forEach((table) => Object.values(table).forEach((row) => results.push(...Object.values(row))));
    return results;
};
const parseValue = (value) => {
    if (typeof value === 'string') {
        const dateInMilliseconds = Date.parse(value);
        if (!isNaN(dateInMilliseconds)) {
            return dateInMilliseconds;
        }
    }
    return value;
};
const isIn = (a, ...values) => {
    const expression = parseValue(a);
    for (const value of values) {
        if (expression === parseValue(value)) {
            return true;
        }
    }
    return false;
};
const isEq = (a, b) => typeof a === 'object' && typeof b === 'object'
    ? JSON.stringify(a) === JSON.stringify(b)
    : parseValue(a) === parseValue(b);
const isGt = (a, b) => parseValue(a) > parseValue(b);
const isLt = (a, b) => parseValue(a) < parseValue(b);
const isBetween = (a, min, max) => parseValue(a) >= parseValue(min) && parseValue(a) <= parseValue(max);
const isLikeString = (a, b) => new RegExp(`^${b.replace(/(?<!\\)\%/g, '.*').replace(/(?<!\\)\_/g, '.')}$`, 'g').test(a);
const runCondition = (condition, ...values) => {
    const data = [];
    values.forEach((value) => {
        if (utils_1.isQueryResult(value)) {
            const values = exports.getQueryResultValues(value.getData());
            data.push(...values);
        }
        else {
            data.push(value);
        }
    });
    return condition(...data);
};
const select = (property) => (content) => (row) => {
    if (row.table.name === property.table.name) {
        if (chego_tools_1.isAlias(property)) {
            content[property.alias] = row.content[property.name];
        }
        else if (chego_tools_1.isRowId(property)) {
            content[property.alias] = row.key;
        }
        else if (property.name === '*') {
            content = Object.assign(content, row.content);
        }
        else {
            content[property.name] = row.content[property.name];
        }
    }
    return content;
};
const conditionTemplate = (condition, row, property, ...values) => row.table.name === property.table.name
    ? chego_tools_1.isRowId(property)
        ? Number(runCondition(condition, row.key, ...values))
        : Number(runCondition(condition, row.content[property.name], ...values))
    : chego_api_1.FilterResultEnum.Skipped;
const whereIn = (...values) => (property) => (row) => conditionTemplate(isIn, row, property, ...values);
const eq = (value) => (property) => (row) => conditionTemplate(isEq, row, property, value);
const isNull = () => (property) => eq(null)(property);
const gt = (value) => (property) => (row) => conditionTemplate(isGt, row, property, value);
const lt = (value) => (property) => (row) => conditionTemplate(isLt, row, property, value);
const between = (min, max) => (property) => (row) => conditionTemplate(isBetween, row, property, min, max);
const like = (value) => (property) => (row) => typeof value === 'string'
    ? conditionTemplate(isLikeString, row, property, value)
    : conditionTemplate(isEq, row, property, value);
const exists = (value) => () => () => {
    const data = value.getData();
    return Array.isArray(data) ? data.length : chego_api_1.FilterResultEnum.Skipped;
};
const and = () => () => () => '&&';
const or = () => () => () => '||';
const not = () => () => () => '!';
const openParentheses = () => () => () => '(';
const closeParentheses = () => () => () => ')';
exports.templates = new Map([
    [chego_api_1.QuerySyntaxEnum.Select, select],
    [chego_api_1.QuerySyntaxEnum.EQ, eq],
    [chego_api_1.QuerySyntaxEnum.Null, isNull],
    [chego_api_1.QuerySyntaxEnum.GT, gt],
    [chego_api_1.QuerySyntaxEnum.LT, lt],
    [chego_api_1.QuerySyntaxEnum.And, and],
    [chego_api_1.QuerySyntaxEnum.Or, or],
    [chego_api_1.QuerySyntaxEnum.Not, not],
    [chego_api_1.QuerySyntaxEnum.OpenParentheses, openParentheses],
    [chego_api_1.QuerySyntaxEnum.CloseParentheses, closeParentheses],
    [chego_api_1.QuerySyntaxEnum.Between, between],
    [chego_api_1.QuerySyntaxEnum.Like, like],
    [chego_api_1.QuerySyntaxEnum.In, whereIn],
    [chego_api_1.QuerySyntaxEnum.Exists, exists],
]);
//# sourceMappingURL=templates.js.map