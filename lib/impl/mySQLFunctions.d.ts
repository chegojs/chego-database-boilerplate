import { Row } from '../api/types';
import { IQueryContext } from '../api/interfaces';
export declare const applyMySQLFunctionsIfAny: (queryContext: IQueryContext) => (data: Map<string, Row[]>) => Map<string, Row[]>;
