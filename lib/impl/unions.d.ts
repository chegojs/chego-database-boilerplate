import { Union } from '../api/types';
import { IQueryResult } from '@chego/chego-api';
import { Row } from '../api/types';
import { IQueryContext } from '../api/interfaces';
export declare const storeOnlyUniqueEntriesIfRequired: (queryContext: IQueryContext) => (queryResult: Map<string, Row[]>) => Map<string, Row[]>;
export declare const applyUnionsIfAny: (queryContext: IQueryContext) => (queryResult: Map<string, Row[]>) => Map<string, Row[]>;
export declare const newUnion: (distinct: boolean, data: IQueryResult) => Union;
