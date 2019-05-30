import { Table, QuerySyntaxEnum, Property, IQueryResult } from '@chego/chego-api';
export declare type Row = {
    table: Table;
    key: string;
    content: any;
    scheme: string[];
};
export declare type DataMap = Map<string, Row[]>;
export declare type JoinType = QuerySyntaxEnum.Join | QuerySyntaxEnum.FullJoin | QuerySyntaxEnum.LeftJoin | QuerySyntaxEnum.RightJoin;
export declare type Join = {
    type: JoinType;
    propertyA: Property;
    propertyB: Property;
};
export declare type Union = {
    data: IQueryResult;
    distinct: boolean;
};
export declare type FormulaRegEx = {
    pattern: RegExp;
    replacer: string;
};
export declare type QueryPipeline = (client: any, data: any) => Promise<any>;
export declare type QueryPipelinesMap = Map<QuerySyntaxEnum, QueryPipeline>;
export declare type OutputDataSnapshot = {
    [tableName: string]: any[];
};
export declare type InputDataSnapshot = {
    [tableName: string]: object;
};
