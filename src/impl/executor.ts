import { QueryPipelinesMap, QueryPipeline } from './../api/types';
import { IQuery, IQueryScheme, IQuerySchemeArray, IQuerySchemeElement, QuerySyntaxEnum } from '@chego/chego-api';
import { IQueryContext, IQueryContextBuilder, IQueriesExecutor } from '../api/interfaces';
import { newQueryContextBuilder } from './contextBuilder';
import { isQueryScheme } from '@chego/chego-tools';
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

const pickPipeline = (pipelines: QueryPipelinesMap, type: QuerySyntaxEnum) => (): Promise<QueryPipeline> => new Promise((resolve, reject) => {
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
const executeQueryScopeWithClient = (client: any, pipelines: QueryPipelinesMap) => (queryScope: IQueryContext[]) =>
    queryScope.reduce((queries, query) =>
        queries.then(pickPipeline(pipelines, query.type))
            .then((pipeline: any) => pipeline(client, query)), Promise.resolve())

export const newExecutor = (): IQueriesExecutor => {
    let queryPipelines: QueryPipelinesMap;
    let dbClient: QueryPipelinesMap;
    const executor: IQueriesExecutor = {
        withPipelines: (pipelines: QueryPipelinesMap): any => (queryPipelines = pipelines, executor),
        withDBClient: (client: any): any => (dbClient = client, executor),
        execute: (queries: IQuery[]): Promise<any> => new Promise((resolve, reject) =>
            queries.reduce((queries, query) =>
                queries
                    .then(buildQueryScope(query))
                    .then(executeQueryScopeWithClient(dbClient, queryPipelines)),
                Promise.resolve())
                .then(resolve)
                .catch(reject))
    }
    return executor;
}