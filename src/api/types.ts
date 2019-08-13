import { Fn, LogicalOperatorScope } from '@chego/chego-api';
import { Table, QuerySyntaxEnum, Property, IQueryResult, ScopeContent, CustomCondition } from '@chego/chego-api';

export type Row = { table:Table, key:string, content:any, scheme:string[] };
export type DataMap = Map<string, Row[]>;
export type JoinType = QuerySyntaxEnum.Join | QuerySyntaxEnum.FullJoin | QuerySyntaxEnum.LeftJoin | QuerySyntaxEnum.RightJoin;
export type Join = { type:JoinType, propertyA:Property, propertyB:Property };
export type Union = { data:IQueryResult, distinct:boolean };
export type BetweenData = { min:number, max:number };
export type FormulaRegEx = { pattern:RegExp, replacer: string }
export type QueryPipeline = (client:any, data:any) => Promise<any>;
export type QueryPipelinesMap = Map<QuerySyntaxEnum, QueryPipeline>
export type OutputDataSnapshot = {[tableName:string]:any[]}
export type InputDataSnapshot = {[tableName:string]:object}
export type KeychainScope = { type: QuerySyntaxEnum, properties: Keychain[] }
export type Keychain = Property | KeychainScope | CustomCondition;
export type Expressions = ExpressionOrExpressionScope | IExpressionsArray;
export interface IExpressionsArray extends Array<Expressions> {};
export type Expression = { type:QuerySyntaxEnum, not:boolean, property:Property, value:any, custom:Fn<any> };
export type ExpressionScope = { type:QuerySyntaxEnum, expressions:Expressions[] };
export type ExpressionOrExpressionScope = Expression | ExpressionScope;
export type GroupedValues = { customConditions:CustomCondition[], rest:any[] };
export type SQLSyntaxTemplateData = {negation?:boolean, property?:string}
export type SQLSyntaxTemplate = (data?:SQLSyntaxTemplateData) => (...values:any[]) => string;
export type LogicalOperatorHandleData = {operator:QuerySyntaxEnum, condition:QuerySyntaxEnum, negation:boolean, properties:ScopeContent[], values:any[]}
export type QueryBuilderHandle = (type:QuerySyntaxEnum, params:any[]) => void
export type UseTemplateData = {type: QuerySyntaxEnum, negation?: boolean, property?: Property | CustomCondition, values?: any}
export type SQLQuery = { type:QuerySyntaxEnum, body:string };