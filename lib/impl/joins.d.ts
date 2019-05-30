import { IJoinBuilder } from '../api/interfaces';
import { Row, Join, JoinType } from '../api/types';
import { Property, Table } from '@chego/chego-api';
export declare const newJoin: (type: JoinType, property: Property) => Join;
export declare const newJoinBuilder: (type: JoinType, tableA: Table, tableB: Table) => IJoinBuilder;
export declare const mergeTableB2TableA: (join: Join, results: Map<string, Row[]>) => (tableBContent: any) => Map<string, Row[]>;
