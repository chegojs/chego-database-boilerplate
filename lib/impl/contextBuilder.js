"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chego_api_1 = require("@chego/chego-api");
const queryContext_1 = require("./queryContext");
const chego_tools_1 = require("@chego/chego-tools");
const utils_1 = require("./utils");
const joins_1 = require("./joins");
const unions_1 = require("./unions");
const conditions_1 = require("./conditions");
const isPrimaryCommand = (type) => type === chego_api_1.QuerySyntaxEnum.Select
    || type === chego_api_1.QuerySyntaxEnum.Update
    || type === chego_api_1.QuerySyntaxEnum.Insert
    || type === chego_api_1.QuerySyntaxEnum.Delete;
const ifStringThenParseToTable = (tables, table) => {
    if (typeof table === 'string') {
        if (chego_tools_1.isAliasString(table)) {
            const data = table.replace(/ {1,}/g, ' ').split(' AS ');
            return tables.concat(chego_tools_1.newTable(data[0], data[1]));
        }
        return tables.concat(chego_tools_1.newTable(table));
    }
    return tables.concat(table);
};
const ifAliasThenParseToTable = (tables, table) => (chego_tools_1.isAlias(table))
    ? tables.concat(chego_tools_1.newTable(table.name, table.alias))
    : tables.concat(table);
const ifEmptyTableSetDefault = (defaultTable) => (list, data) => {
    if (chego_tools_1.isProperty(data) && !data.table) {
        data.table = defaultTable;
    }
    return list.concat(data);
};
const ifLogicalOperatorScopeThenParseItsKeys = (defaultTable) => (list, data) => {
    if (chego_tools_1.isLogicalOperatorScope(data)) {
        data.properties.reduce(chego_tools_1.combineReducers(ifEmptyTableSetDefault(defaultTable), ifLogicalOperatorScopeThenParseItsKeys(defaultTable)), []);
    }
    return list.concat(data);
};
const handleMySqlFunctions = (mySqlFunctions) => (keys, data) => {
    if (chego_tools_1.isMySQLFunction(data)) {
        mySqlFunctions.push(data);
        return keys.concat(data.properties);
    }
    return keys.concat(data);
};
const parseStringToSortingData = (defaultTable) => (data, entry) => {
    const entryParts = entry.replace(/ {1,}/g, ' ').split(' ');
    if (entryParts.length > 2) {
        throw new Error(`There is something wrong with this order by "${entry}"`);
    }
    data.push(chego_tools_1.newSortingData(chego_tools_1.parseStringToProperty(entryParts[0], defaultTable), utils_1.parseStringToSortingOrderEnum(entryParts[1])));
    return data;
};
const parseResultsToUnions = (distinct) => (list, data) => (list.push(unions_1.newUnion(distinct, data)), list);
exports.newQueryContextBuilder = () => {
    let tempJoinBuilder;
    const queryContext = queryContext_1.newQueryContext();
    const history = [];
    const conditionsBuilder = conditions_1.newConditionsBuilder(history);
    const handleSelect = (...args) => {
        queryContext.data = args.reduce(handleMySqlFunctions(queryContext.functions), []);
    };
    const handleInsert = (...args) => {
        queryContext.data = args;
    };
    const handleUpdate = (...args) => {
        queryContext.tables = args.reduce(chego_tools_1.combineReducers(ifStringThenParseToTable, ifAliasThenParseToTable), []);
    };
    const handleDelete = (...args) => {
        queryContext.data = args;
    };
    const handleFrom = (...args) => {
        queryContext.tables = args.reduce(chego_tools_1.combineReducers(ifStringThenParseToTable, ifAliasThenParseToTable), []);
        queryContext.data.reduce(ifEmptyTableSetDefault(queryContext.tables[0]), []);
    };
    const handleOrderBy = (...args) => {
        queryContext.orderBy = args.reduce(parseStringToSortingData(queryContext.tables[0]), []);
    };
    const handleGroupBy = (...args) => {
        queryContext.groupBy = args.reduce(parseStringToSortingData(queryContext.tables[0]), []);
    };
    const handleJoin = (type) => (...args) => {
        const defualtTable = queryContext.tables[0];
        if (!defualtTable) {
            throw new Error(`"defaultTable" is undefined`);
        }
        tempJoinBuilder = joins_1.newJoinBuilder(type, defualtTable, args[0]);
    };
    const handleOn = (...args) => {
        if (!tempJoinBuilder) {
            throw new Error(`"latestJoin" is undefined`);
        }
        queryContext.joins.push(tempJoinBuilder.withOn(args[0], args[1]).build());
        tempJoinBuilder = null;
    };
    const handleUsing = (...args) => {
        if (!tempJoinBuilder) {
            throw new Error(`"latestJoin" is undefined`);
        }
        queryContext.joins.push(tempJoinBuilder.using(args[0]).build());
        tempJoinBuilder = null;
    };
    const handleTo = (...args) => {
        queryContext.tables = args.reduce(chego_tools_1.combineReducers(ifStringThenParseToTable, ifAliasThenParseToTable), []);
    };
    const handleSet = (...args) => {
        queryContext.data = args;
    };
    const handleKeychain = (type) => (...args) => {
        const defaultTable = queryContext.tables[0];
        const keys = args.reduce(chego_tools_1.combineReducers(ifEmptyTableSetDefault(defaultTable), ifLogicalOperatorScopeThenParseItsKeys(defaultTable), chego_tools_1.mergePropertiesWithLogicalAnd), []);
        conditionsBuilder.add(type, ...keys);
    };
    const handleLimit = (...args) => {
        queryContext.limit = chego_tools_1.newLimit(args[0], args[1]);
    };
    const handleParentheses = (type) => () => {
        conditionsBuilder.add(type);
    };
    const handleNot = () => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Not);
    };
    const handleBetween = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Between, args);
    };
    const handleEQ = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.EQ, ...args);
    };
    const handleLT = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.LT, ...args);
    };
    const handleGT = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.GT, ...args);
    };
    const handleLike = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Like, ...args);
    };
    const handleNull = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Null, ...args);
    };
    const handleExists = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Exists, ...args);
    };
    const handleIn = (...args) => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.In, ...args);
    };
    const handleUnion = (...args) => {
        queryContext.unions.push(...args.reduce(parseResultsToUnions(true), []));
    };
    const handleUnionAll = (...args) => {
        queryContext.unions.push(...args.reduce(parseResultsToUnions(false), []));
    };
    const handleAnd = () => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.And);
    };
    const handleOr = () => {
        conditionsBuilder.add(chego_api_1.QuerySyntaxEnum.Or);
    };
    const handles = new Map([
        [chego_api_1.QuerySyntaxEnum.Delete, handleDelete],
        [chego_api_1.QuerySyntaxEnum.Insert, handleInsert],
        [chego_api_1.QuerySyntaxEnum.Select, handleSelect],
        [chego_api_1.QuerySyntaxEnum.Update, handleUpdate],
        [chego_api_1.QuerySyntaxEnum.From, handleFrom],
        [chego_api_1.QuerySyntaxEnum.Where, handleKeychain(chego_api_1.QuerySyntaxEnum.Where)],
        [chego_api_1.QuerySyntaxEnum.To, handleTo],
        [chego_api_1.QuerySyntaxEnum.Set, handleSet],
        [chego_api_1.QuerySyntaxEnum.Limit, handleLimit],
        [chego_api_1.QuerySyntaxEnum.Between, handleBetween],
        [chego_api_1.QuerySyntaxEnum.EQ, handleEQ],
        [chego_api_1.QuerySyntaxEnum.GT, handleGT],
        [chego_api_1.QuerySyntaxEnum.Like, handleLike],
        [chego_api_1.QuerySyntaxEnum.LT, handleLT],
        [chego_api_1.QuerySyntaxEnum.Null, handleNull],
        [chego_api_1.QuerySyntaxEnum.Not, handleNot],
        [chego_api_1.QuerySyntaxEnum.And, handleAnd],
        [chego_api_1.QuerySyntaxEnum.Or, handleOr],
        [chego_api_1.QuerySyntaxEnum.LeftJoin, handleJoin(chego_api_1.QuerySyntaxEnum.LeftJoin)],
        [chego_api_1.QuerySyntaxEnum.RightJoin, handleJoin(chego_api_1.QuerySyntaxEnum.RightJoin)],
        [chego_api_1.QuerySyntaxEnum.Join, handleJoin(chego_api_1.QuerySyntaxEnum.Join)],
        [chego_api_1.QuerySyntaxEnum.FullJoin, handleJoin(chego_api_1.QuerySyntaxEnum.FullJoin)],
        [chego_api_1.QuerySyntaxEnum.On, handleOn],
        [chego_api_1.QuerySyntaxEnum.Using, handleUsing],
        [chego_api_1.QuerySyntaxEnum.OrderBy, handleOrderBy],
        [chego_api_1.QuerySyntaxEnum.GroupBy, handleGroupBy],
        [chego_api_1.QuerySyntaxEnum.OpenParentheses, handleParentheses(chego_api_1.QuerySyntaxEnum.OpenParentheses)],
        [chego_api_1.QuerySyntaxEnum.CloseParentheses, handleParentheses(chego_api_1.QuerySyntaxEnum.CloseParentheses)],
        [chego_api_1.QuerySyntaxEnum.Union, handleUnion],
        [chego_api_1.QuerySyntaxEnum.UnionAll, handleUnionAll],
        [chego_api_1.QuerySyntaxEnum.Exists, handleExists],
        [chego_api_1.QuerySyntaxEnum.Having, handleKeychain(chego_api_1.QuerySyntaxEnum.Having)],
        [chego_api_1.QuerySyntaxEnum.In, handleIn]
    ]);
    const builder = {
        with: (type, params) => {
            const handle = handles.get(type);
            if (handle) {
                console.log(chego_api_1.QuerySyntaxEnum[type]);
                handle(...params);
            }
            if (isPrimaryCommand(type)) {
                queryContext.type = type;
            }
            history.push(type);
        },
        build: () => {
            queryContext.conditions = conditionsBuilder.build();
            console.log('@!!!', JSON.stringify(queryContext.conditions));
            return queryContext;
        }
    };
    return builder;
};
//# sourceMappingURL=contextBuilder.js.map