"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_api_1 = require("@chego/chego-api");
const chego_tools_1 = require("@chego/chego-tools");
const validateWhere = (values) => {
    if (values.length === 0) {
        throw new Error('Empty WHERE clausule');
    }
    if (chego_tools_1.isLogicalOperatorScope(values[0])) {
        throw new Error('First condition key is logical operator');
    }
    noArgsValidation(values);
    return true;
};
const noArgsValidation = (...args) => {
    if (args.length === 0) {
        throw new Error('No arguments!');
    }
    return true;
};
const validateSet = (...args) => {
    if (args.length > 1) {
        throw new Error('Too many arguments');
    }
    noArgsValidation(...args);
    return true;
};
const validateEQ = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateLT = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateGT = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateLimit = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateBetween = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateFrom = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateExists = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateHaving = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateUnion = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateOrderBy = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateTo = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateUpdate = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateIn = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateInsert = (...args) => {
    noArgsValidation(...args);
    return true;
};
const validateJoin = (...args) => {
    if (!chego_tools_1.isTable(args[0])) {
        throw new Error(`given argument is not a Property object`);
    }
    noArgsValidation(...args);
    return true;
};
const validateUsing = (...args) => {
    if (!chego_tools_1.isProperty(args[0])) {
        throw new Error(`given argument is not a Property object`);
    }
    noArgsValidation(...args);
    return true;
};
const validateOn = (...args) => {
    for (const arg of args) {
        if (!chego_tools_1.isProperty(arg)) {
            throw new Error(`given argument is not a Property object`);
        }
    }
    noArgsValidation(...args);
    return true;
};
exports.validators = new Map([
    [chego_api_1.QuerySyntaxEnum.Where, validateWhere],
    [chego_api_1.QuerySyntaxEnum.Set, validateSet],
    [chego_api_1.QuerySyntaxEnum.Join, validateJoin],
    [chego_api_1.QuerySyntaxEnum.FullJoin, validateJoin],
    [chego_api_1.QuerySyntaxEnum.LeftJoin, validateJoin],
    [chego_api_1.QuerySyntaxEnum.RightJoin, validateJoin],
    [chego_api_1.QuerySyntaxEnum.On, validateOn],
    [chego_api_1.QuerySyntaxEnum.EQ, validateEQ],
    [chego_api_1.QuerySyntaxEnum.LT, validateLT],
    [chego_api_1.QuerySyntaxEnum.GT, validateGT],
    [chego_api_1.QuerySyntaxEnum.Limit, validateLimit],
    [chego_api_1.QuerySyntaxEnum.Between, validateBetween],
    [chego_api_1.QuerySyntaxEnum.From, validateFrom],
    [chego_api_1.QuerySyntaxEnum.Exists, validateExists],
    [chego_api_1.QuerySyntaxEnum.Having, validateHaving],
    [chego_api_1.QuerySyntaxEnum.Union, validateUnion],
    [chego_api_1.QuerySyntaxEnum.OrderBy, validateOrderBy],
    [chego_api_1.QuerySyntaxEnum.To, validateTo],
    [chego_api_1.QuerySyntaxEnum.Update, validateUpdate],
    [chego_api_1.QuerySyntaxEnum.In, validateIn],
    [chego_api_1.QuerySyntaxEnum.Insert, validateInsert],
    [chego_api_1.QuerySyntaxEnum.Using, validateUsing],
]);
//# sourceMappingURL=validators.js.map