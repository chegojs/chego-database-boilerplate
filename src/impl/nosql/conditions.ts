import { Keychain, KeychainScope, Expression } from './../../api/types';
import { QuerySyntaxEnum, Fn, Property, ScopeContent } from '@chego/chego-api';
import { isLogicalOperatorScope, newLogicalOperatorScope, isCustomCondition } from '@chego/chego-tools';
import { IConditionsBuilder } from '../../api/interfaces';
import { Expressions, ExpressionScope } from '../../api/types';
import { newExpressionScope, newExpression } from '../utils';

const isAndOr = (type: QuerySyntaxEnum): boolean => type === QuerySyntaxEnum.And || type === QuerySyntaxEnum.Or;

const parseValue = (value: any) => {
    if (value.table === null && value.type === -1 && value.alias === '') {
        return value.name;
    }
    return value;
}

export const newConditionsBuilder = (history: QuerySyntaxEnum[]): IConditionsBuilder => {
    const expressions: Expressions[] = [];
    let root: Expressions[] = expressions;
    let keychain: Keychain[] = [];
    let negation: boolean = false;
    let scopePointer: ExpressionScope;
    let followingScopePointer: ExpressionScope;
    let previousScopePointer: ExpressionScope;

    const handleKeychain = (type: QuerySyntaxEnum) => (...keys: Keychain[]): void => {
        const lastType: QuerySyntaxEnum = history[history.length - 1];
        const penultimateType: QuerySyntaxEnum = history[history.length - 2];

        if (isAndOr(lastType) && penultimateType === type) {
            const lastKey: Keychain = keychain[keychain.length - 1];
            (<KeychainScope>lastKey).properties.push(...keys);
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
        } else {
            if (!scopePointer) {
                const last: Expressions = root.pop();
                const scope: ExpressionScope = newExpressionScope(type, [last]);
                scopePointer = scope;
                root.push(scope);
            } else {
                const scope: ExpressionScope = newExpressionScope(scopePointer.type, [...scopePointer.expressions]);
                scopePointer.type = type;
                scopePointer.expressions = [scope];
            }
        }
    }

    const buildExpression = (type: QuerySyntaxEnum, key: Keychain, value: any): Expression =>
        isCustomCondition(key)
            ? newExpression(type, negation, null, parseValue(value), key.condition)
            : newExpression(type, negation, <Property>key, parseValue(value), null);

    const buildExpressionScope = (type: QuerySyntaxEnum, input: ScopeContent[], reducer: Fn<Expressions[]>) => {
        const list = input.reduce(reducer, []);
        const scope = newExpressionScope(type, list);
        followingScopePointer = scope;
        return scope;
    }

    const keychainToExpressions = (type: QuerySyntaxEnum, value: any) => (result: Expressions[], key: Keychain): Expressions[] => {
        if (isLogicalOperatorScope(key)) {
            const scope: ExpressionScope = buildExpressionScope(key.type, key.properties, keychainToExpressions(type, value))
            result.push(scope);
        } else {
            result.push(buildExpression(type, key, value));
        }
        return result;
    }

    const valuesToExpressions = (type: QuerySyntaxEnum, keychain: Keychain[]) => (result: Expressions[], value: any): Expressions[] => {
        const expressions: Expressions = [];
        if (isLogicalOperatorScope(value)) {
            const scope: ExpressionScope = buildExpressionScope(value.type, value.properties, valuesToExpressions(type, keychain))
            result.push(scope);
        } else {
            keychain.reduce(keychainToExpressions(type, value), expressions);
            result.push(...expressions);
        }
        return result;
    }

    const handleCondition = (type: QuerySyntaxEnum, values?: any[]): void => {
        const expressions: Expressions[] = values.reduce(valuesToExpressions(type, keychain), []);
        if (scopePointer) {
            scopePointer.expressions.push(...expressions);
            scopePointer = followingScopePointer;
        } else {
            root.push(...expressions);
        }
        followingScopePointer = null;
        negation = false;
    }

    const openParentheses = () => {
        root = [];
        previousScopePointer = scopePointer;
        scopePointer = null;
    }

    const closeParentheses = () => {
        if (previousScopePointer) {
            previousScopePointer.expressions.push(root);
        } else {
            expressions.push(root);
        }
        scopePointer = previousScopePointer;
        previousScopePointer = null;
    }

    const setNegation = () => {
        negation = true;
    }

    const handles = new Map<QuerySyntaxEnum, Fn<void>>([
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
        build(): Expressions[] {
            return expressions;
        }
    }
}