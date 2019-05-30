"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_api_1 = require("@chego/chego-api");
const chego_tools_1 = require("@chego/chego-tools");
const isAndOr = (type) => type === chego_api_1.QuerySyntaxEnum.And || type === chego_api_1.QuerySyntaxEnum.Or;
const parseValue = (value) => {
    if (value.table === null && value.type === -1 && value.alias === '') {
        return value.name;
    }
    return value;
};
const handleValues = (type, negation, property, values) => values.reduce((list, value) => (list.push(chego_tools_1.isLogicalOperatorScope(value)
    ? chego_tools_1.newExpressionScope(value.type, handleValues(type, negation, property, value.properties))
    : chego_tools_1.newExpression(type, negation, property, parseValue(value))), list), []);
const handleMultipleKeys = (type, negation, keychain, values) => keychain.reduce((list, c) => list.concat(chego_tools_1.isLogicalOperatorScope(c)
    ? [chego_tools_1.newExpressionScope(c.type, handleMultipleKeys(type, negation, c.properties, values))]
    : handleValues(type, negation, c, values)), []);
exports.newConditionsBuilder = (history) => {
    const conditions = [];
    let keychain = [];
    let negation = false;
    let root = conditions;
    const handleKeychain = (type) => (...keys) => {
        const lastType = history[history.length - 1];
        const penultimateType = history[history.length - 2];
        if (isAndOr(lastType) && penultimateType === type) {
            const lastKey = keychain[keychain.length - 1];
            if (!chego_tools_1.isLogicalOperatorScope(lastKey)) {
                throw new Error(`Key ${lastKey} should be LogialOperatorScope type!`);
            }
            lastKey.properties.push(...keys);
        }
        else {
            keychain = [...keys];
        }
    };
    const handleLogicalOperator = (type) => () => {
        const lastType = history[history.length - 1];
        if (lastType === chego_api_1.QuerySyntaxEnum.Where) {
            const last = keychain.pop();
            if (chego_tools_1.isLogicalOperatorScope(last) && last.type === type) {
                keychain.push(last);
            }
            else {
                keychain.push(chego_tools_1.newLogicalOperatorScope(type, [last]));
            }
        }
        else {
            const last = root.pop();
            if (last) {
                root.push(chego_tools_1.newExpressionScope(type, [last]));
            }
        }
    };
    const handleCondition = (type, values) => {
        const multipleKeys = (keychain.length > 1 || chego_tools_1.isLogicalOperatorScope(keychain[0]));
        const expressions = multipleKeys
            ? handleMultipleKeys(type, negation, keychain, values)
            : handleValues(type, negation, keychain[0], values);
        const last = root.pop();
        if (chego_tools_1.isExpressionScope(last)) {
            last.expressions.push(...expressions);
            root.push(last);
        }
        else {
            root.push(...expressions);
        }
        negation = false;
    };
    const openParentheses = () => {
        root = [];
    };
    const closeParentheses = () => {
        const last = conditions.pop();
        if (chego_tools_1.isExpressionScope(last)) {
            last.expressions.push(...root);
            conditions.push(last);
        }
        else {
            conditions.push(last, ...root);
        }
        root = conditions;
    };
    const setNegation = () => {
        negation = true;
    };
    const handles = new Map([
        [chego_api_1.QuerySyntaxEnum.Where, handleKeychain(chego_api_1.QuerySyntaxEnum.Where)],
        [chego_api_1.QuerySyntaxEnum.Having, handleKeychain(chego_api_1.QuerySyntaxEnum.Having)],
        [chego_api_1.QuerySyntaxEnum.OpenParentheses, openParentheses],
        [chego_api_1.QuerySyntaxEnum.CloseParentheses, closeParentheses],
        [chego_api_1.QuerySyntaxEnum.Not, setNegation],
        [chego_api_1.QuerySyntaxEnum.And, handleLogicalOperator(chego_api_1.QuerySyntaxEnum.And)],
        [chego_api_1.QuerySyntaxEnum.Or, handleLogicalOperator(chego_api_1.QuerySyntaxEnum.Or)]
    ]);
    return {
        add(type, ...values) {
            const handle = handles.get(type);
            if (handle) {
                handle(...values);
            }
            else {
                handleCondition(type, values);
            }
        },
        build() {
            return conditions;
        }
    };
};
//# sourceMappingURL=conditions.js.map