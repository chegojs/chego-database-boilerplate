import { QuerySyntaxEnum, IQueryResult, Table, Limit, SortingData, FunctionData, Property, IQuery, Fn } from '@chego/chego-api';
import { Join, QueryPipelinesMap, Union, Expressions, SQLSyntaxTemplate, SQLQuery } from './types';

export interface IConditionsBuilder {
    add(type: QuerySyntaxEnum,  ...values: any[]): void;
    build(): Expressions[];
}

export interface IJoinBuilder {
    withOn(propertyA:Property, propertyB:Property): IJoinBuilder;
    using(property:Property): IJoinBuilder;
    build(): Join;
}

export interface IQueriesExecutor {
    withPipelines(pipelines: QueryPipelinesMap): IQueriesExecutor;
    withDBRef(client: any): IQueriesExecutor;
    execute(queries: IQuery[]): Promise<any>;
}

export interface ISqlQueriesExecutor {
    withTransactionsHandle(handle: Fn<Promise<any>>): ISqlQueriesExecutor;
    withQueryHandle(handle: Fn<Promise<any>>): ISqlQueriesExecutor;
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
    unions:Union[];
    limit:Limit;
    orderBy:SortingData[];
    groupBy:SortingData[];
    functions:FunctionData[];
    expressions:Expressions[];
}

export interface ISQLQueryBuilder {
    with(type:QuerySyntaxEnum, params:any[]):void;
    build():SQLQuery;
}

export interface ISelectionbuilder {
    build(params:any[]):string;
}