import { QuerySyntaxEnum, IQueryResult, Table, Limit, SortingData, FunctionData, Fn, Property, IQuery } from '@chego/chego-api';
import { Row, Join, QueryPipelinesMap } from './types';

export interface IConditions {
    add(...conditions: Fn[]):void;
    test(row:Row):boolean;
}

export interface IJoinBuilder {
    withOn(propertyA:Property, propertyB:Property): IJoinBuilder;
    using(property:Property): IJoinBuilder;
    build(): Join;
}

export interface IQueriesExecutor {
    withPipelines(pipelines: QueryPipelinesMap): IQueriesExecutor;
    withDBClient(client: any): IQueriesExecutor;
    execute(queries: IQuery[]): Promise<any>;
}

export interface IQueryContextBuilder {
    with(type: QuerySyntaxEnum, params: any[]): void;
    build(): IQueryContext;
}

export interface IQueryContext {
    type:QuerySyntaxEnum;
    result:IQueryResult;
    data:any[];
    tables:Table[];
    joins:Join[];
    unions:any[];
    limit:Limit;
    orderBy:SortingData[];
    groupBy:SortingData[];
    functions:FunctionData[];
    conditions:IConditions;
}