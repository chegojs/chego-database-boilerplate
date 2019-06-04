import { QuerySyntaxEnum } from '@chego/chego-api';
import { isLogicalOperatorScope, isProperty, isTable } from '@chego/chego-tools';

const validateWhere = (values: any[]): boolean => {
    if (values.length === 0) {
        throw new Error('Empty WHERE clausule')
    }
    if (isLogicalOperatorScope(values[0])) {
        throw new Error('First condition key is logical operator')
    }
    noArgsValidation(values);
    return true;
}

const noArgsValidation = (...args: any[]): boolean => {
    if (args.length === 0) {
        throw new Error('No arguments!');
    }
    return true;
}

const validateSet = (...args: any[]): boolean => {
    if (args.length > 1) {
        throw new Error('Too many arguments');
    }
    noArgsValidation(...args);
    return true;
}

const validateEQ = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateLT = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateGT = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateLimit = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateBetween = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateFrom = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateExists = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateHaving = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateUnion = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateOrderBy = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateTo = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}
const validateUpdate = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}
const validateIn = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}
const validateInsert = (...args: any[]): boolean => {
    noArgsValidation(...args);
    return true;
}

const validateJoin = (...args: any[]): boolean => {
    if (!isTable(args[0])) {
        throw new Error(`given argument is not a Property object`);
    }
    noArgsValidation(...args);
    return true;
}

const validateUsing = (...args: any[]): boolean => {
    if (!isProperty(args[0])) {
        throw new Error(`given argument is not a Property object`);
    }
    noArgsValidation(...args);
    return true;
}

const validateOn = (...args: any[]): boolean => {
    for (const arg of args) {
        if (!isProperty(arg)) {
            throw new Error(`given argument is not a Property object`);
        }
    }
    noArgsValidation(...args);
    return true;
}

export const validators = new Map<QuerySyntaxEnum, (...args: any[]) => boolean>([
    [QuerySyntaxEnum.Where, validateWhere],
    [QuerySyntaxEnum.Set, validateSet],
    [QuerySyntaxEnum.Join, validateJoin],
    [QuerySyntaxEnum.FullJoin, validateJoin],
    [QuerySyntaxEnum.LeftJoin, validateJoin],
    [QuerySyntaxEnum.RightJoin, validateJoin],
    [QuerySyntaxEnum.On, validateOn],
    [QuerySyntaxEnum.EQ, validateEQ],
    [QuerySyntaxEnum.LT, validateLT],
    [QuerySyntaxEnum.GT, validateGT],
    [QuerySyntaxEnum.Limit, validateLimit],
    [QuerySyntaxEnum.Between, validateBetween],
    [QuerySyntaxEnum.From, validateFrom],
    [QuerySyntaxEnum.Exists, validateExists],
    [QuerySyntaxEnum.Having, validateHaving],
    [QuerySyntaxEnum.Union, validateUnion],
    [QuerySyntaxEnum.OrderBy, validateOrderBy],
    [QuerySyntaxEnum.To, validateTo],
    [QuerySyntaxEnum.Update, validateUpdate],
    [QuerySyntaxEnum.In, validateIn],
    [QuerySyntaxEnum.Insert, validateInsert],
    [QuerySyntaxEnum.Using, validateUsing],
]);