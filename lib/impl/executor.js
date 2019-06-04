"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contextBuilder_1 = require("./contextBuilder");
const chego_tools_1 = require("@chego/chego-tools");
const validators_1 = require("./validators");
const parseScheme = (scheme) => {
    let queryScope = [];
    const contextBuilder = contextBuilder_1.newQueryContextBuilder();
    const schemeArr = scheme.toArray();
    schemeArr.map((element) => {
        let args = element.params;
        if (Array.isArray(element.params) && chego_tools_1.isQueryScheme(element.params[0])) {
            const subQueryScope = parseScheme(element.params[0]);
            queryScope = [...subQueryScope, ...queryScope];
            const subQuery = subQueryScope[0];
            args = [subQuery.result];
        }
        if (validators_1.validators.has(element.type)) {
            validators_1.validators.get(element.type)(...args);
        }
        contextBuilder.with(element.type, args);
    });
    queryScope.push(contextBuilder.build());
    return queryScope;
};
const pickPipeline = (pipelines, type) => () => new Promise((resolve, reject) => {
    const pipeline = pipelines.get(type);
    return pipeline ? resolve(pipeline) : reject('No pipeline');
});
const buildQueryScope = (query) => () => {
    const queryScope = parseScheme(query.scheme);
    if (!queryScope) {
        throw new Error('Empty QueryScope');
    }
    return Promise.resolve(queryScope);
};
const executeQueryScope = (dbRef, pipelines) => (queryScope) => queryScope.reduce((queries, query) => queries.then(pickPipeline(pipelines, query.type))
    .then((pipeline) => pipeline(dbRef, query))
    .then((result) => { query.result.setData(result); return result; }), Promise.resolve());
exports.newExecutor = () => {
    let queryPipelines;
    let dbRef;
    const executeQueries = (queries) => new Promise((resolve, reject) => queries.reduce((queries, query) => queries
        .then(buildQueryScope(query))
        .then(executeQueryScope(dbRef, queryPipelines)), Promise.resolve())
        .then(resolve)
        .catch(reject));
    const executor = {
        withPipelines: (pipelines) => (queryPipelines = pipelines, executor),
        withDBRef: (ref) => (dbRef = ref, executor),
        execute: (queries) => chego_tools_1.withValidator()
            .check(() => queryPipelines !== undefined)
            .check(() => dbRef !== undefined)
            .thenCall(executeQueries, queries)
    };
    return executor;
};
//# sourceMappingURL=executor.js.map