import { QueryPipelinesMap, QueryPipeline } from './../api/types';
import { IQuery, IQueryScheme, IQuerySchemeArray, IQuerySchemeElement, QuerySyntaxEnum } from '@chego/chego-api';
import { IQueryContext, IQueryContextBuilder, IQueriesExecutor } from '../api/interfaces';
import { newQueryContextBuilder } from './contextBuilder';
import { isQueryScheme, withValidator } from '@chego/chego-tools';
import { validators } from './validators';

const parseScheme = (scheme: IQueryScheme): IQueryContext[] => {
    let queryScope: IQueryContext[] = [];
    const contextBuilder: IQueryContextBuilder = newQueryContextBuilder();
    const schemeArr: IQuerySchemeArray = scheme.toArray();

    schemeArr.map((element: IQuerySchemeElement) => {
        let args: any = element.params;
        if (Array.isArray(element.params) && isQueryScheme(element.params[0])) {
            const subQueryScope: IQueryContext[] = parseScheme(element.params[0]);
            queryScope = [...subQueryScope, ...queryScope];
            const subQuery: IQueryContext = subQueryScope[0];
            args = [subQuery.result];
        }
        if (validators.has(element.type)) {
            validators.get(element.type)(...args);
        }
        contextBuilder.with(element.type, args);
    });
    queryScope.push(contextBuilder.build());
    return queryScope;
};

const pickPipeline = (pipelines: QueryPipelinesMap, type: QuerySyntaxEnum) => (): Promise<QueryPipeline> =>
    new Promise((resolve, reject) => {
        const pipeline: QueryPipeline = pipelines.get(type);
        return pipeline ? resolve(pipeline) : reject('No pipeline');
    });

const buildQueryScope = (query: IQuery) => () => {
    const queryScope: IQueryContext[] = parseScheme(query.scheme);
    if (!queryScope) {
        throw new Error('Empty QueryScope');
    }
    return Promise.resolve(queryScope);
}
const executeQueryScope = (dbRef: object, pipelines: QueryPipelinesMap) => (queryScope: IQueryContext[]) =>
    queryScope.reduce((queries, query) =>
        queries.then(pickPipeline(pipelines, query.type))
            .then((pipeline: QueryPipeline) => pipeline(dbRef, query))
            .then((result) => { query.result.setData(result); return result; }),
            Promise.resolve());

export const newExecutor = (): IQueriesExecutor => {
    let queryPipelines: QueryPipelinesMap;
    let dbRef: object;

    const executeQueries = (queries: IQuery[]) => new Promise((resolve, reject) => queries.reduce((queries, query) =>
        queries
            .then(buildQueryScope(query))
            .then(executeQueryScope(dbRef, queryPipelines)),
        Promise.resolve())
        .then(resolve)
        .catch(reject))

    const executor: IQueriesExecutor = {
        withPipelines: (pipelines: QueryPipelinesMap): IQueriesExecutor => (queryPipelines = pipelines, executor),
        withDBRef: (ref: object): IQueriesExecutor => (dbRef = ref, executor),
        execute: (queries: IQuery[]): Promise<any> => withValidator<Promise<any>>()
            .check(() => queryPipelines !== undefined)
            .check(() => dbRef !== undefined)
            .thenCall(executeQueries, queries)
    }
    return executor;
}
