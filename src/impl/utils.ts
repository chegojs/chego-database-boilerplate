import { newProperty } from '@chego/chego-tools';
import { DataMap, Row, Union, JoinType, Join } from '../api/types';
import { SortingOrderEnum, IQueryResult, Property, Table } from '@chego/chego-api';
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
            Object.assign(propA, first);
            Object.assign(propB, second);
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