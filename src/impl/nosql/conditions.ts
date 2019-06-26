import { PropertyOrLogicalOperatorScope, QuerySyntaxEnum, Fn } from '@chego/chego-api';
import { isLogicalOperatorScope, newLogicalOperatorScope } from '@chego/chego-tools';
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
    let keychain: PropertyOrLogicalOperatorScope[] = [];
    let negation: boolean = false;
    let scopePointer: ExpressionScope;
    let followingScopePointer: ExpressionScope;
    let previousScopePointer: ExpressionScope;

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

    const keychainToExpressions = (type: QuerySyntaxEnum, value: any) => (result: Expressions[], key: PropertyOrLogicalOperatorScope): Expressions[] => {
        if (isLogicalOperatorScope(key)) {
            const list = key.properties.reduce(keychainToExpressions(type, value), []);
            const scope = newExpressionScope(key.type, list);
            followingScopePointer = scope;
            result.push(scope);
        } else {
            result.push(newExpression(type, negation, key, parseValue(value)));
        }
        return result;
    }

    const valuesToExpressions = (type: QuerySyntaxEnum, keychain: PropertyOrLogicalOperatorScope[]) => (result: Expressions[], value: any): Expressions[] => {
        const expressions: Expressions = [];
        if (isLogicalOperatorScope(value)) {
            value.properties.reduce(valuesToExpressions(type, keychain), expressions);
            const scope = newExpressionScope(value.type, expressions);
            followingScopePointer = scope;
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
        if(previousScopePointer) {
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
