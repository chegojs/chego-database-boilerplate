import { Row, DataMap, InputDataSnapshot, OutputDataSnapshot } from '../api/types';
import { Limit, Property, Table, QuerySyntaxEnum } from '@chego/chego-api';
import { newRow, newDataMap } from './utils';
import { IQueryContext } from '../api/interfaces';
import { templates } from './templates';

export const parseRowsToArray = (result: any[], row: Row): any[] => (result.push(Object.assign({}, row.content)), result);
export const parseRowsToObject = (result: any, row: Row): any => (Object.assign(result, { [row.key]: row.content }), result);

export const shouldFilterRowContent = (properties: Property[]): boolean => properties && properties.length > 0 && properties[0].name !== '*';

export const parseDataSnapshotToRows = (table: Table, data: any): Row[] => {
    const rows: Row[] = [];
    let content: any;
    for (const key in data) {
        content = data[key];
        rows.push(newRow({
            table,
            key,
            scheme: Object.keys(content),
            content
        }))
    }
    return rows;
}


export const filterQueryResultsIfRequired = (queryContext: IQueryContext) => (queryResult: DataMap): DataMap => {
    const parsedResult: DataMap = newDataMap();
    const select = templates.get(QuerySyntaxEnum.Select);
    let tableRows: Row[];

    queryResult.forEach((rows: Row[], tableName: string) => {
        tableRows = rows.filter((row: Row, index: number) => {
            if (queryContext.conditions.test(row)) {
                if (shouldFilterRowContent(queryContext.data) && queryContext.type === QuerySyntaxEnum.Select) {
                    row.content = queryContext.data.reduce((content: any, property: Property) => select(property)(content)(row), {});
                }
                return true;
            }
            return false;
        });
        parsedResult.set(tableName, tableRows);
    });
    return parsedResult;
}

export const convertMapToInputData = (tablesMap: DataMap): InputDataSnapshot => {
    const results: InputDataSnapshot = {};
    tablesMap.forEach((rows: Row[], table: string) => {
        Object.assign(results, { [table]: rows.reduce(parseRowsToObject, {}) });
    }, results);
    return results;
}

export const convertMapToOutputData = (tablesMap: DataMap): OutputDataSnapshot => {
    const results: OutputDataSnapshot = {};
    tablesMap.forEach((rows: Row[], table: string) => {
        Object.assign(results, { [table]: rows.reduce(parseRowsToArray, []) });
    }, results);
    return results;
}

export const spliceQueryResultsIfRequired = (limit: Limit) => (data: any): any => {
    if (limit) {
        const range: number[] = limit.count
            ? [limit.offsetOrCount, limit.count]
            : limit.offsetOrCount < 0
                ? [limit.offsetOrCount]
                : [0, limit.offsetOrCount];

        for (const table of Object.keys(data)) {
            data[table] = data[table].slice(...range)
        }
    }
    return data;
}

const nullifyRows = (rows: Row[], row: Row): Row[] => [...rows, Object.assign(row, { content: null })];

const nullifyRowsContent = (keysToRemove: Property[]) => (rows: Row[], row: Row): Row[] => {
    for (const key of keysToRemove) {
        if(row.scheme.indexOf(key.name) > -1) {
            row.content[key.name] = null;
        }
    }
    return [...rows, row];
}

export const containsSelectAllShorthand = (properties: Property[]) => properties.reduce((result:boolean,property:Property) => {
    if(property.name === '*') {
        result = true;
    }
    return result;
},false);

export const shouldNullifyEntireRows = (properties: Property[]) => properties.length === 0 || containsSelectAllShorthand(properties);

export const nullifyData = (properties: Property[]) => (data: DataMap): DataMap => {
    const action: (rows: Row[], row: Row) => Row[] = shouldNullifyEntireRows(properties) ? nullifyRows : nullifyRowsContent(properties);
    data.forEach((rows: Row[], table: string) => {
        const nullifiedData: Row[] = rows.reduce(action, []);
        data.set(table, nullifiedData);
    });
    return data;
}

export const withErrorMessage = (errors: Map<string, Error>): string => {
    const message: string[] = [];
    errors.forEach((error: Error, table: string) => {
        message.push(`Operation on table "${table}" failed: ${error.message}`)
    });
    return message.join('\n');
}

export const updateContent = (newContent: any) => (data: DataMap): DataMap => {
    data.forEach((rows: Row[]) => {
        rows.map((row:Row)=>{
            for(const key of Object.keys(newContent)) {
                row.content[key] = newContent[key];
            }
        });
    });
    return data;
}