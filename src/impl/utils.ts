import { newProperty } from '@chego/chego-tools';
import { DataMap, Row, Union, JoinType, Join, Expression, Expressions, ExpressionScope } from '../api/types';
import { SortingOrderEnum, IQueryResult, Property, Table, QuerySyntaxEnum } from '@chego/chego-api';
import { IJoinBuilder } from '../api/interfaces';


export const createEmptyObject = (keys: string[]) => keys.reduce((acc: any, c: string) => { acc[c] = null; return acc; }, {});

export const newDataMap = (iterable?: any[]): DataMap => new Map<string, Row[]>(iterable);

export const newRow = ({ table = null, key = '', scheme = [], content = {} }: Row): Row => ({
    table, key, scheme, content
});

export const parseStringToSortingOrderEnum = (value: string): SortingOrderEnum => {
    const order: string = value && value.toUpperCase();
    return order
        ? (<any>SortingOrderEnum)[order] ? (<any>SortingOrderEnum)[order] : SortingOrderEnum.ASC
        : SortingOrderEnum.ASC;
}

export const isQueryResult = (value: any): value is IQueryResult => value && (<IQueryResult>value).getData !== undefined;
export const basicSort = (a: any, b: any, direction: SortingOrderEnum) => direction * ((a < b) ? -1 : (a > b) ? 1 : 0);

export const isNumeric = (n:any):boolean => !isNaN(parseFloat(n)) && isFinite(n);

export const newUnion = (distinct:boolean, data:IQueryResult): Union => ({distinct, data});

export const newJoin = (type:JoinType, property:Property): Join => ({type, propertyB:property, propertyA:newProperty({})});

export const newJoinBuilder = (type:JoinType, tableA:Table, tableB:Table): IJoinBuilder => {
    const propA:Property = newProperty({});
    const propB:Property = newProperty({});

    const builder: IJoinBuilder = {
        withOn:(first:Property, second:Property) : IJoinBuilder => {
            Object.assign(propA, first, { table:tableA });
            Object.assign(propB, second, { table:tableB });
            return builder;
        },
        using:(property:Property) : IJoinBuilder => {
            Object.assign(propA, property, { table:tableA });
            Object.assign(propB, property, { table:tableB });
            return builder;
        },
        build:() => ({type, propertyA:propA, propertyB:propB})
    }
    return builder;
}

export const newExpression = (type: QuerySyntaxEnum, not: boolean, property: Property, value: any): Expression => ({ type, not, value, property });

export const newExpressionScope = (type: QuerySyntaxEnum, expressions: Expressions[]): ExpressionScope => ({ type, expressions });

export const isExpressionScope = (data: any): data is ExpressionScope =>
    data
    && Object.keys(data).length === 2
    && (<ExpressionScope>data).type !== undefined
    && (<ExpressionScope>data).expressions !== undefined;

export const isExpression = (value: any): value is Expression =>
    value
    && Object.keys(value).length === 4
    && (<Expression>value).type !== undefined
    && (<Expression>value).not !== undefined
    && (<Expression>value).value !== undefined
    && (<Expression>value).property !== undefined;