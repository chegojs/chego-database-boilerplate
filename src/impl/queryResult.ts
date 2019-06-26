import { IQueryResult, AnyButFunction } from "@chego/chego-api";

export const newQueryResult = (): IQueryResult => {
    let result: AnyButFunction;
    return {
        setData: (value: AnyButFunction): void => {
            result = value;
        },
        getData: (): AnyButFunction => result
    }
}