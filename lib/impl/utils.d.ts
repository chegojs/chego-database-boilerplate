import { Row } from '../api/types';
import { SortingOrderEnum, IQueryResult } from '@chego/chego-api';
export declare const createEmptyObject: (keys: string[]) => any;
export declare const newDataMap: (iterable?: any[]) => Map<string, Row[]>;
export declare const newRow: ({ table, key, scheme, content }: Row) => Row;
export declare const parseStringToSortingOrderEnum: (value: string) => SortingOrderEnum;
export declare const isQueryResult: (value: any) => value is IQueryResult;
export declare const basicSort: (a: any, b: any, direction: SortingOrderEnum) => number;
export declare const isNumeric: (n: any) => boolean;
