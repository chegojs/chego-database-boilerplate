import { Obj, QuerySyntaxTemplate, QuerySyntaxEnum } from '@chego/chego-api';
export declare const getQueryResultValues: (data: string | number | boolean | any[] | Obj) => (string | number | boolean | any[] | Obj)[];
export declare const templates: Map<QuerySyntaxEnum, QuerySyntaxTemplate>;
