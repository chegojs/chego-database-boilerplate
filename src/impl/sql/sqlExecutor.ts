import { IQuery, QuerySyntaxEnum, Fn } from '@chego/chego-api';
import { withValidator } from '@chego/chego-tools';
import { ISqlQueriesExecutor } from '../../api/interfaces';
import { SQLSyntaxTemplate } from '../../api/types';

export const newSqlExecutor = (): ISqlQueriesExecutor => {
    let pTransactionsHandle: Fn<Promise<any>>;
    let pQueryHandle: Fn<Promise<any>>;

    const executeQueries = (queries: IQuery[]) => new Promise((resolve, reject) =>
        ((queries.length > 1)
            ? pTransactionsHandle(queries)
            : pQueryHandle(queries[0]))
            .then(resolve)
            .catch(reject));

    const executor: ISqlQueriesExecutor = {
        withTransactionsHandle: (handle: Fn<Promise<any>>): ISqlQueriesExecutor => (pTransactionsHandle = handle, executor),
        withQueryHandle: (handle: Fn<Promise<any>>): ISqlQueriesExecutor => (pQueryHandle = handle, executor),
        execute: (queries: IQuery[]): Promise<any> => withValidator<Promise<any>>()
            .check(() => pTransactionsHandle !== undefined)
            .check(() => pQueryHandle !== undefined)
            .thenCall(executeQueries, queries)
    }
    return executor;
}