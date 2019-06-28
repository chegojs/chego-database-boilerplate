import { QuerySyntaxEnum, FunctionData, Fn } from '@chego/chego-api';
import { isProperty, isMySQLFunction } from '@chego/chego-tools';
import { parsePropertyToString } from '../utils';
import { ISelectionbuilder } from '../../api/interfaces';
export const newSelectionBuilder = (functions: Map<QuerySyntaxEnum, Fn<string>>): ISelectionbuilder => {
    const parseFunctionToSelection = (current: FunctionData) => {
        const functionTemplate: Fn<string> = functions.get(current.type);
        const data: FunctionData = Object.assign({}, { alias: current.alias, type: current.type }, { param: parseToSelection(current.param) });
        const alias: string = data.alias !== data.param ? `AS "${data.alias}"` : null;
        return functionTemplate(data.param, alias);
    }
    const selectionReducer = (list: any[], current: any): any[] => (list.push(parseToSelection(current)), list);
    const parseArrayToSelection = (data: any[]) => data.reduce(selectionReducer, []);
    const parseObjectToSelection = (data: any) => {
        const res: any = {};
        for (const key of Object.keys(data)) {
            Object.assign(res, { [key]: parseToSelection(data[key]) });
        }
        return res;
    }

    const parseToSelection = (current: any) => {
        if (isProperty(current)) {
            return parsePropertyToString(current);
        } else if (isMySQLFunction(current)) {
            return parseFunctionToSelection(current);
        } else if (Array.isArray(current)) {
            return parseArrayToSelection(current);
        } else if (typeof current === 'object') {
            return parseObjectToSelection(current);
        } else {
            return current;
        }
    }

    return {
        build: (params: any[]): string => {
            return params.reduce((list: any[], current: any) => {
                list.push(parseToSelection(current));
                return list;
            }, []).join(', ');
        }
    }
}