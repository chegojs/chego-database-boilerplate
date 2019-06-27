import { SQLQuery } from './../../api/types';
import { ISQLQueryBuilder } from '../../api/interfaces';
import { SQLSyntaxTemplate, LogicalOperatorHandleData, QueryBuilderHandle, UseTemplateData } from '../../api/types';
import { QuerySyntaxEnum, PropertyOrLogicalOperatorScope, Property, Fn, Obj, Table } from "@chego/chego-api";
import { parsePropertyToString, parseTableToString, escapeValue } from '../utils';
import { mergePropertiesWithLogicalAnd, isLogicalOperatorScope, newLogicalOperatorScope } from '@chego/chego-tools';
import { validators } from '../validators';

export const newSqlQueryBuilder = (templates:Map<QuerySyntaxEnum, SQLSyntaxTemplate>): ISQLQueryBuilder => {
    let keychain: PropertyOrLogicalOperatorScope[] = [];
    const query:SQLQuery = { type:QuerySyntaxEnum.Undefined, body:'' };
    const queryParts: any[] = [];
    const history: QuerySyntaxEnum[] = [];

    const handlePrimary = (handle:(type: QuerySyntaxEnum, params: any[]) => void) => (type: QuerySyntaxEnum, params: any[]) => {
        if(queryParts.length === 0) {
            query.type = type;
        }
        handle(type, params);
    }

    const handleSelect = (type: QuerySyntaxEnum, params: any[]): void => {
        const template: SQLSyntaxTemplate = templates.get(QuerySyntaxEnum.Select);
        
        if (template) {
            const selection: string = (params.length === 0)
                ? '*'
                : params.reduce((result: string[], current: Property) => {
                    const key = parsePropertyToString(current, false);
                    result.push(current.alias ? `${key} AS ${current.alias}` : key)
                    return result;
                }, []).join(', ');

            queryParts.push(template()(selection));
        }
    }

    const handleFrom = (type: QuerySyntaxEnum, params: any[]): void => {
        const template: SQLSyntaxTemplate = templates.get(QuerySyntaxEnum.From);
        if (template) {
            const tables: string = params.reduce((result: string[], current: Property) => {
                const key = parseTableToString(current);
                result.push(current.alias ? `${key} ${current.alias}` : key)
                return result;
            }, []).join(', ');

            queryParts.push(template()(tables));
        }
    }

    const handleWhere = (type: QuerySyntaxEnum, params: any[]): void => {
        const previousType: QuerySyntaxEnum = history[history.length - 1];
        const penultimateType: QuerySyntaxEnum = history[history.length - 2];
        const values: PropertyOrLogicalOperatorScope[] = params.reduce(mergePropertiesWithLogicalAnd, [])
        if (
            (previousType === QuerySyntaxEnum.And || previousType === QuerySyntaxEnum.Or)
            && penultimateType === QuerySyntaxEnum.Where
        ) {
            const lastKey: PropertyOrLogicalOperatorScope = keychain[keychain.length - 1];
            if (!isLogicalOperatorScope(lastKey)) {
                throw new Error(`Key ${lastKey} should be LogialOperatorScope type!`)
            }
            lastKey.properties.push(...values);
        } else {
            if (keychain.length === 0 && templates.has(QuerySyntaxEnum.Where)) {
                queryParts.push(templates.get(QuerySyntaxEnum.Where)()());
            }
            keychain = [...values];
        }
    }

    const getUnifiedKeysList = (objects: Obj[]): string[] => {
        const list: string[] = [];
        for (const obj of objects) {
            for (const key of Object.keys(obj)) {
                if (list.indexOf(key) === -1) {
                    list.push(key);
                }
            }
        }
        return list;
    }

    const addEmptyProperty = (item: Obj) => (key: string) => {
        if (!item.hasOwnProperty(key)) {
            item[key] = null;
        }
    }

    const addEmptyMissingProperties = (keys: string[]) =>
        (items: any[], item: any): any[] => (keys.forEach(addEmptyProperty(item)), [...items, item]);

    const prepareInsertValuesList = (result: string[], item: Obj): string[] => {
        const values: any[] = Object.values(item).reduce(escapeValues, []);
        result.push(`(${values.join(', ')})`);
        return result;
    }

    const handleInsert = (type: QuerySyntaxEnum, params: any[]): void => {
        const keys: string[] = getUnifiedKeysList(params);
        const items: any[] = params.reduce(addEmptyMissingProperties(keys), []);
        const values: string[] = items.reduce(prepareInsertValuesList, []);

        if (templates.has(type)) {
            queryParts.push(templates.get(type)()(keys, values));
        }
    }

    const parseTablesToStrings = (list: string[], table: Table) => (list.push(parseTableToString(table)), list);

    const handleTo = (type: QuerySyntaxEnum, params: any[]): void => {
        const previousType: QuerySyntaxEnum = history[history.length - 1];
        if (previousType === QuerySyntaxEnum.Insert) {
            const tables: string[] = params.reduce(parseTablesToStrings, []);
            if (templates.has(type)) {
                queryParts.splice(-1, 0, templates.get(type)()(tables));
            }
        }
    }

    const handleUpdate = (type: QuerySyntaxEnum, params: any[]): void => {
        const tables: string[] = params.reduce(parseTablesToStrings, []);
        if (templates.has(type)) {
            queryParts.push(templates.get(type)()(tables));
        }
    }

    const prepareSetValues = (properties: Obj) => (list: string[], key: string): string[] =>
        (list.push(`${key} = ${escapeValue(properties[key])}`), list);

    const handleSet = (type: QuerySyntaxEnum, params: any[]): void => {
        const properties: Obj = params[0];
        if (properties) {
            const values: string[] = Object.keys(properties).reduce(prepareSetValues(properties), []);
            if (templates.has(type)) {
                queryParts.push(templates.get(type)()([values]));
            }
        }
    }

    const handleIn = (type: QuerySyntaxEnum, params: any[]) => {
        const values: any[] = params.reduce(escapeValues, [])
        queryParts.push(...useTemplate({ type, values }));
    }

    const handleUnion = (type: QuerySyntaxEnum, params: any[]) => {
        for (const param of params) {
            queryParts.push(...useTemplate({ type, values: [param] }));
        }
    }

    const handleJoin = (type: QuerySyntaxEnum, params: any[]): void => {
        const tables: string[] = params.reduce(parseTablesToStrings, []);
        if (templates.has(type)) {
            queryParts.push(templates.get(type)()(tables));
        }
    }

    const handleOn = (type: QuerySyntaxEnum, params: any[]): void => {
        const keys: string[] = params.reduce((list: string[], prop: Property) => (list.push(parsePropertyToString(prop)), list), []);
        if (templates.has(type)) {
            queryParts.push(templates.get(type)()(...keys));
        }
    }

    const handleUsing = (type: QuerySyntaxEnum, params: any[]): void => {
        if (templates.has(type)) {
            queryParts.push(templates.get(type)()(parsePropertyToString(params[0])));
        }
    }

    const handleLogicalOperator = (type: QuerySyntaxEnum, params: any[]): void => {
        const previousType: QuerySyntaxEnum = history[history.length - 1];
        if (previousType === QuerySyntaxEnum.Where) {
            keychain.push(newLogicalOperatorScope(type));
        } else {
            if (templates.has(type)) {
                queryParts.push(templates.get(type)()());
            }
        }
    }

    const injectOperator = (operator:string) => (result: string[], condition: string, i:number): string[] => {
        if(i > 0) {
            result.push(operator);
        }
        result.push(condition);
        return result;
    }

    const handleLogicalOperatorScope = (data: LogicalOperatorHandleData): string[] => {
        const conditionHandle: Fn<any> = isMultiValuedCondition(data.condition, data.values) ? handleMultiValuedCondition : handleSingleValuedCondition;
        const conditions:any[] = data.properties.reduce(conditionHandle(data.condition, data.negation, data.values), []);
        const operatorTemplate:string = templates.get(data.operator)()();
        return conditions.reduce(injectOperator(operatorTemplate), []);
    }

    const useTemplate = ({ type, negation, property, values }: UseTemplateData): string[] => {
        const key: string = property ? parsePropertyToString(property, true) : null;
        return (templates.has(type))
            ? [templates.get(type)({ negation, property: key })(...values)]
            : [];
    }

    const handleMultiValuedCondition = (type: QuerySyntaxEnum, negation: boolean, values: any[]) =>
        (result: any[], key: PropertyOrLogicalOperatorScope): string[] => {
            if (isLogicalOperatorScope(key)) {
                result.push(handleLogicalOperatorScope({ operator: key.type, condition: type, negation, properties: key.properties, values }));
            } else {
                values.forEach((value: any) => {
                    if (isLogicalOperatorScope(value)) {
                        result.push(handleLogicalOperatorScope({ operator: value.type, condition: type, negation, properties: [key], values: value.properties }));
                    } else {
                        result.push(...useTemplate({ type, negation, property: key, values: [escapeValue(parsePropertyToString(value))] }));
                    }
                });
            }
            return result;
        }

    const escapeValues = (list: any[], value: any) => (list.push(escapeValue(value)), list);

    const handleSingleValuedCondition = (type: QuerySyntaxEnum, negation: boolean, values: any[]) =>
        (parts: string[], key: PropertyOrLogicalOperatorScope): string[] => {
            if (isLogicalOperatorScope(key)) {
                parts.push(...handleLogicalOperatorScope({ operator: key.type, condition: type, negation, properties: key.properties, values }));
            } else {
                const parsedValues: any[] = values.reduce(escapeValues, [])
                parts.push(...useTemplate({ type, negation, property: key, values: parsedValues }));
            }
            return parts;
        }

    const isMultiValuedCondition = (type: QuerySyntaxEnum, values: any[]): boolean =>
        (values.length > 1 || isLogicalOperatorScope(values[0]))
        && (
            type === QuerySyntaxEnum.EQ
            || type === QuerySyntaxEnum.GT
            || type === QuerySyntaxEnum.LT
            || type === QuerySyntaxEnum.Like);

    const handleCondition = (type: QuerySyntaxEnum, params: any[]): void => {
        const previousType: QuerySyntaxEnum = history[history.length - 1];
        const isNegation: boolean = previousType === QuerySyntaxEnum.Not;

        if (isMultiValuedCondition(type, params)) {
            const values: PropertyOrLogicalOperatorScope[] = params.reduce(mergePropertiesWithLogicalAnd, []);
            queryParts.push(keychain.reduce(handleMultiValuedCondition(type, isNegation, values), []));
        } else {
            queryParts.push(keychain.reduce(handleSingleValuedCondition(type, isNegation, params), []));
        }
    }

    const defaultHandle = (type: QuerySyntaxEnum, params: any[]) => {
        queryParts.push(...useTemplate({ type, values: params }));
    }

    const buildQuery = (query:string[], current:any):string[] => {
        if(Array.isArray(current)) {
            query.push(...current.reduce(buildQuery, []));
        } else {
            query.push(current);
        }
        return query;
    }

    const handles = new Map<QuerySyntaxEnum, QueryBuilderHandle>([
        [QuerySyntaxEnum.From, handleFrom],
        [QuerySyntaxEnum.Select, handlePrimary(handleSelect)],
        [QuerySyntaxEnum.Where, handleWhere],
        [QuerySyntaxEnum.EQ, handleCondition],
        [QuerySyntaxEnum.LT, handleCondition],
        [QuerySyntaxEnum.GT, handleCondition],
        [QuerySyntaxEnum.Like, handleCondition],
        [QuerySyntaxEnum.Null, handleCondition],
        [QuerySyntaxEnum.Between, handleCondition],
        [QuerySyntaxEnum.And, handleLogicalOperator],
        [QuerySyntaxEnum.Or, handleLogicalOperator],
        [QuerySyntaxEnum.OpenParentheses, defaultHandle],
        [QuerySyntaxEnum.CloseParentheses, defaultHandle],
        [QuerySyntaxEnum.Delete, handlePrimary(defaultHandle)],
        [QuerySyntaxEnum.Insert, handlePrimary(handleInsert)],
        [QuerySyntaxEnum.Update, handlePrimary(handleUpdate)],
        [QuerySyntaxEnum.To, handleTo],
        [QuerySyntaxEnum.Set, handleSet],
        [QuerySyntaxEnum.Exists, defaultHandle],
        [QuerySyntaxEnum.Union, handleUnion],
        [QuerySyntaxEnum.UnionAll, handleUnion],
        [QuerySyntaxEnum.OrderBy, defaultHandle],
        [QuerySyntaxEnum.GroupBy, defaultHandle],
        [QuerySyntaxEnum.FullJoin, handleJoin],
        [QuerySyntaxEnum.LeftJoin, handleJoin],
        [QuerySyntaxEnum.RightJoin, handleJoin],
        [QuerySyntaxEnum.Join, handleJoin],
        [QuerySyntaxEnum.On, handleOn],
        [QuerySyntaxEnum.Using, handleUsing],
        [QuerySyntaxEnum.Having, defaultHandle],
        [QuerySyntaxEnum.In, handleIn],
        [QuerySyntaxEnum.Limit, defaultHandle],
    ]);

    const builder: ISQLQueryBuilder = {
        with: (type: QuerySyntaxEnum, params: any[]): void => {
            const handle = handles.get(type);
            if (validators.has(type)) {
                validators.get(type)(...params);
            }
            if (handle) {
                handle(type, params);
            }
            history.push(type);
        },
        build: (): SQLQuery => {
            query.body = queryParts.reduce(buildQuery, []).join(' ');
            return query;
        }
    }
    return builder;
}