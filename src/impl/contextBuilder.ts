import { JoinType, Union } from '../api/types';
import { PropertyOrLogicalOperatorScope, QuerySyntaxEnum, Fn, Table, FunctionData, Property, AnyButFunction, SortingData, IQueryResult } from '@chego/chego-api';
import { IQueryContext, IQueryContextBuilder, IJoinBuilder, IConditionsBuilder } from '../api/interfaces';
import { newQueryContext } from './queryContext';
import { combineReducers, mergePropertiesWithLogicalAnd, isLogicalOperatorScope, isProperty, isMySQLFunction, isAliasString, newTable, isAlias, newSortingData, parseStringToProperty, newLimit } from '@chego/chego-tools';
import { parseStringToSortingOrderEnum, newJoinBuilder, newUnion } from './utils';
import { newConditionsBuilder } from './conditions';

const isPrimaryCommand = (type: QuerySyntaxEnum) => type === QuerySyntaxEnum.Select
    || type === QuerySyntaxEnum.Update
    || type === QuerySyntaxEnum.Insert
    || type === QuerySyntaxEnum.Delete;

const ifStringThenParseToTable = (tables: Table[], table: any) => {
    if (typeof table === 'string') {
        if (isAliasString(table)) {
            const data: string[] = table.replace(/ {1,}/g, ' ').split(' AS ');
            return tables.concat(newTable(data[0], data[1]));
        }
        return tables.concat(newTable(table));
    }
    return tables.concat(table);
}

const ifAliasThenParseToTable = (tables: Table[], table: any) => (isAlias(table))
    ? tables.concat(newTable(table.name, table.alias))
    : tables.concat(table);

const ifEmptyTableSetDefault = (defaultTable: Table) => (list: PropertyOrLogicalOperatorScope[], data: PropertyOrLogicalOperatorScope) => {
    if (isProperty(data) && !data.table) {
        data.table = defaultTable;
    }
    return list.concat(data);
}

const ifLogicalOperatorScopeThenParseItsKeys = (defaultTable: Table) => (list: PropertyOrLogicalOperatorScope[], data: PropertyOrLogicalOperatorScope) => {
    if (isLogicalOperatorScope(data)) {
        data.properties.reduce(
            combineReducers(
                ifEmptyTableSetDefault(defaultTable),
                ifLogicalOperatorScopeThenParseItsKeys(defaultTable),
            ), []);
    }
    return list.concat(data);
}

const handleMySqlFunctions = (mySqlFunctions: FunctionData[]) => (keys: Property[], data: Property | FunctionData) => {
    if (isMySQLFunction(data)) {
        mySqlFunctions.push(data);
        return keys.concat(data.properties);
    }
    return keys.concat(data);
}

const parseStringToSortingData = (defaultTable: Table) => (data: SortingData[], entry: string): SortingData[] => {
    const entryParts = entry.replace(/ {1,}/g, ' ').split(' ');

    if (entryParts.length > 2) {
        throw new Error(`There is something wrong with this order by "${entry}"`);
    }
    data.push(newSortingData(
        parseStringToProperty(entryParts[0], defaultTable),
        parseStringToSortingOrderEnum(entryParts[1])
    ));
    return data;
}

const parseResultsToUnions = (distinct: boolean) => (list: Union[], data: IQueryResult) => (list.push(newUnion(distinct, data)), list);

export const newQueryContextBuilder = (): IQueryContextBuilder => {
    let tempJoinBuilder: IJoinBuilder;
    const queryContext: IQueryContext = newQueryContext();
    const history: QuerySyntaxEnum[] = [];
    const conditionsBuilder: IConditionsBuilder = newConditionsBuilder(history);

    const handleSelect = (...args: any[]): void => {
        queryContext.data = args.reduce(handleMySqlFunctions(queryContext.functions), []);
    }

    const handleInsert = (...args: any[]): void => {
        queryContext.data = args;
    }

    const handleUpdate = (...args: any[]): void => {
        queryContext.tables = args.reduce(combineReducers(
            ifStringThenParseToTable,
            ifAliasThenParseToTable
        ), []);
    }

    const handleDelete = (...args: any[]): void => {
        queryContext.data = args;
    }

    const handleFrom = (...args: any[]): void => {
        queryContext.tables = args.reduce(combineReducers(
            ifStringThenParseToTable,
            ifAliasThenParseToTable
        ), []);
        queryContext.data.reduce(ifEmptyTableSetDefault(queryContext.tables[0]), []);
    }

    const handleOrderBy = (...args: any[]): void => {
        queryContext.orderBy = args.reduce(parseStringToSortingData(queryContext.tables[0]), []);
    }

    const handleGroupBy = (...args: any[]): void => {
        queryContext.groupBy = args.reduce(parseStringToSortingData(queryContext.tables[0]), []);
    }

    const handleJoin = (type: JoinType) => (...args: any[]): void => {
        const defualtTable = queryContext.tables[0];
        if (!defualtTable) {
            throw new Error(`"defaultTable" is undefined`)
        }
        tempJoinBuilder = newJoinBuilder(type, defualtTable, args[0]);
    }

    const handleOn = (...args: any[]): void => {
        if (!tempJoinBuilder) {
            throw new Error(`"latestJoin" is undefined`)
        }
        queryContext.joins.push(tempJoinBuilder.withOn(args[0], args[1]).build());
        tempJoinBuilder = null;
    }

    const handleUsing = (...args: any[]): void => {
        if (!tempJoinBuilder) {
            throw new Error(`"latestJoin" is undefined`)
        }
        queryContext.joins.push(tempJoinBuilder.using(args[0]).build());
        tempJoinBuilder = null;
    }

    const handleTo = (...args: any[]): void => {
        queryContext.tables = args.reduce(combineReducers(
            ifStringThenParseToTable,
            ifAliasThenParseToTable
        ), []);
    }

    const handleSet = (...args: AnyButFunction[]): void => {
        queryContext.data = args;
    }

    const handleKeychain = (type: QuerySyntaxEnum) => (...args: any[]): void => {
        const defaultTable: Table = queryContext.tables[0];
        const keys: PropertyOrLogicalOperatorScope[] = args.reduce(
            combineReducers(
                ifEmptyTableSetDefault(defaultTable),
                ifLogicalOperatorScopeThenParseItsKeys(defaultTable),
                mergePropertiesWithLogicalAnd
            ), []);
        conditionsBuilder.add(type, ...keys);
    }

    const handleLimit = (...args: number[]): void => {
        queryContext.limit = newLimit(args[0], args[1]);
    }

    const handleParentheses = (type:QuerySyntaxEnum) => (): void => {
        conditionsBuilder.add(type);
    }

    const handleNot = (): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Not);
    }

    const handleBetween = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Between, args);
    }

    const handleEQ = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.EQ, ...args);
    }

    const handleLT = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.LT, ...args);
    }

    const handleGT = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.GT, ...args);
    }

    const handleLike = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Like, ...args);
    }

    const handleNull = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Null, ...args);
    }

    const handleExists = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Exists, ...args);
    }

    const handleIn = (...args: any[]): void => {
        conditionsBuilder.add(QuerySyntaxEnum.In, ...args);
    }

    const handleUnion = (...args: any[]): void => {
        queryContext.unions.push(...args.reduce(parseResultsToUnions(true), []));
    }

    const handleUnionAll = (...args: any[]): void => {
        queryContext.unions.push(...args.reduce(parseResultsToUnions(false), []));
    }

    const handleAnd = (): void => {
        conditionsBuilder.add(QuerySyntaxEnum.And);
    }

    const handleOr = (): void => {
        conditionsBuilder.add(QuerySyntaxEnum.Or);
    }

    const handles = new Map<QuerySyntaxEnum, Fn<void>>([
        [QuerySyntaxEnum.Delete, handleDelete],
        [QuerySyntaxEnum.Insert, handleInsert],
        [QuerySyntaxEnum.Select, handleSelect],
        [QuerySyntaxEnum.Update, handleUpdate],
        [QuerySyntaxEnum.From, handleFrom],
        [QuerySyntaxEnum.Where, handleKeychain(QuerySyntaxEnum.Where)],
        [QuerySyntaxEnum.To, handleTo],
        [QuerySyntaxEnum.Set, handleSet],
        [QuerySyntaxEnum.Limit, handleLimit],
        [QuerySyntaxEnum.Between, handleBetween],
        [QuerySyntaxEnum.EQ, handleEQ],
        [QuerySyntaxEnum.GT, handleGT],
        [QuerySyntaxEnum.Like, handleLike],
        [QuerySyntaxEnum.LT, handleLT],
        [QuerySyntaxEnum.Null, handleNull],
        [QuerySyntaxEnum.Not, handleNot],
        [QuerySyntaxEnum.And, handleAnd],
        [QuerySyntaxEnum.Or, handleOr],
        [QuerySyntaxEnum.LeftJoin, handleJoin(QuerySyntaxEnum.LeftJoin)],
        [QuerySyntaxEnum.RightJoin, handleJoin(QuerySyntaxEnum.RightJoin)],
        [QuerySyntaxEnum.Join, handleJoin(QuerySyntaxEnum.Join)],
        [QuerySyntaxEnum.FullJoin, handleJoin(QuerySyntaxEnum.FullJoin)],
        [QuerySyntaxEnum.On, handleOn],
        [QuerySyntaxEnum.Using, handleUsing],
        [QuerySyntaxEnum.OrderBy, handleOrderBy],
        [QuerySyntaxEnum.GroupBy, handleGroupBy],
        [QuerySyntaxEnum.OpenParentheses, handleParentheses(QuerySyntaxEnum.OpenParentheses)],
        [QuerySyntaxEnum.CloseParentheses, handleParentheses(QuerySyntaxEnum.CloseParentheses)],
        [QuerySyntaxEnum.Union, handleUnion],
        [QuerySyntaxEnum.UnionAll, handleUnionAll],
        [QuerySyntaxEnum.Exists, handleExists],
        [QuerySyntaxEnum.Having, handleKeychain(QuerySyntaxEnum.Having)],
        [QuerySyntaxEnum.In, handleIn]
    ]);

    const builder: IQueryContextBuilder = {
        with: (type: QuerySyntaxEnum, params: any[]): void => {
            const handle = handles.get(type);
            if (handle) {
                handle(...params);
            }
            if (isPrimaryCommand(type)) {
                queryContext.type = type;
            }
            history.push(type);
        },
        build: (): IQueryContext => {
            queryContext.conditions = conditionsBuilder.build();
            return queryContext;
        }
    }
    return builder;
}