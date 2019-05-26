import { Table, QuerySyntaxEnum, Property, IQueryResult } from '@chego/chego-api';

export type Row = { table:Table, key:string, content:any, scheme:string[] };
export type DataMap = Map<string, Row[]>;
export type JoinType = QuerySyntaxEnum.Join | QuerySyntaxEnum.FullJoin | QuerySyntaxEnum.LeftJoin | QuerySyntaxEnum.RightJoin;
export type Join = { type:JoinType, propertyA:Property, propertyB:Property };
export type Union = { data:IQueryResult, distinct:boolean };
export type FormulaRegEx = { pattern:RegExp, replacer: string }
export type QueryPipeline = (client:any, data:any) => Promise<any>;
export type QueryPipelinesMap = Map<QuerySyntaxEnum, QueryPipeline>
export type OutputDataSnapshot = {[tableName:string]:any[]}
export type InputDataSnapshot = {[tableName:string]:object}