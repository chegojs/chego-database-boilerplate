import { PropertyOrLogicalOperatorScope, QuerySyntaxEnum, Property, ExpressionOrExpressionScope, Fn } from '@chego/chego-api';
import { isLogicalOperatorScope, newExpressionScope, newExpression, newLogicalOperatorScope, isExpressionScope } from '@chego/chego-tools';
import { IConditionsBuilder } from '../api/interfaces';

const isAndOr = (type: QuerySyntaxEnum): boolean => type === QuerySyntaxEnum.And || type === QuerySyntaxEnum.Or;

const parseValue = (value:any) => {
    if(value.table === null && value.type === -1 && value.alias === '') {
        return value.name;
    }
    return value;
}

const handleValues = (type: QuerySyntaxEnum, negation:boolean, property: Property, values: any[]): ExpressionOrExpressionScope[] =>
    values.reduce((list: ExpressionOrExpressionScope[], value: any) =>
        (list.push(isLogicalOperatorScope(value)
            ? newExpressionScope(value.type, handleValues(type, negation, property, value.properties))
            : newExpression(type, negation, property, parseValue(value))
        ), list), []);

const handleMultipleKeys = (type: QuerySyntaxEnum, negation:boolean, keychain: PropertyOrLogicalOperatorScope[], values?: any[]): ExpressionOrExpressionScope[] =>
    keychain.reduce((list: ExpressionOrExpressionScope[], c: PropertyOrLogicalOperatorScope) =>
        list.concat(isLogicalOperatorScope(c)
            ? [newExpressionScope(c.type, handleMultipleKeys(type, negation, c.properties, values))]
            : handleValues(type, negation, c, values)
        ), []);

export const newConditionsBuilder = (history:QuerySyntaxEnum[]): IConditionsBuilder => {
    const conditions: any[] = [];
    let keychain: PropertyOrLogicalOperatorScope[] = [];
    let negation: boolean = false;
    let root: any[] = conditions;

    const handleKeychain = (type: QuerySyntaxEnum) => (...keys: PropertyOrLogicalOperatorScope[]): void => {
        const lastType: QuerySyntaxEnum = history[history.length - 1];
        const penultimateType: QuerySyntaxEnum = history[history.length - 2];

        if (isAndOr(lastType) && penultimateType === type) {
            const lastKey: PropertyOrLogicalOperatorScope = keychain[keychain.length - 1];
            if (!isLogicalOperatorScope(lastKey)) {
                throw new Error(`Key ${lastKey} should be LogialOperatorScope type!`)
            }
            lastKey.properties.push(...keys);
        } else {
            keychain = [...keys];
        }
    }

    const handleLogicalOperator = (type: QuerySyntaxEnum) => (): void => {
        const lastType: QuerySyntaxEnum = history[history.length - 1];
        if (lastType === QuerySyntaxEnum.Where) {
            const last = keychain.pop();
            if (isLogicalOperatorScope(last) && last.type === type) {
                keychain.push(last);
            } else {
                keychain.push(newLogicalOperatorScope(type, [last]))
            }
        } 
        else {
            const last: ExpressionOrExpressionScope = root.pop();
            if(last) {
                root.push(newExpressionScope(type, [last]));
            }
        }
    }

    const handleCondition = (type: QuerySyntaxEnum, values?: any[]): void => {
        const multipleKeys:boolean = (keychain.length > 1 || isLogicalOperatorScope(keychain[0]));
        const expressions = multipleKeys
            ? handleMultipleKeys(type, negation, keychain, values)
            : handleValues(type, negation, <Property>keychain[0], values);

        const last: ExpressionOrExpressionScope = root.pop();
        if (isExpressionScope(last)) {
            last.expressions.push(...expressions);
            root.push(last);
        } else {
            root.push(...expressions);
        }
        negation = false;
    }

    const openParentheses = () => {
        root = [];
    }

    const closeParentheses = () => {
        const last: ExpressionOrExpressionScope = conditions.pop();
        if (isExpressionScope(last)) {
            last.expressions.push(...root);
            conditions.push(last);
        } else {
            conditions.push(last, ...root);
        }
        root = conditions;
    }

    const setNegation = () => {
        negation = true;
    }

    const handles = new Map<QuerySyntaxEnum, Fn>([
        [QuerySyntaxEnum.Where, handleKeychain(QuerySyntaxEnum.Where)],
        [QuerySyntaxEnum.Having, handleKeychain(QuerySyntaxEnum.Having)],
        [QuerySyntaxEnum.OpenParentheses, openParentheses],
        [QuerySyntaxEnum.CloseParentheses, closeParentheses],
        [QuerySyntaxEnum.Not, setNegation],
        [QuerySyntaxEnum.And, handleLogicalOperator(QuerySyntaxEnum.And)],
        [QuerySyntaxEnum.Or, handleLogicalOperator(QuerySyntaxEnum.Or)]
    ]);

    return {
        add(type: QuerySyntaxEnum, ...values: any[]): void {
            const handle = handles.get(type);
            if (handle) {
                handle(...values);
            } else {
                handleCondition(type, values);
            }
        },
        build(): ExpressionOrExpressionScope[] {
            return conditions;
        }
    }
}