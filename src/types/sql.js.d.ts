declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface Database {
    exec(sql: string): QueryExecResult[];
    close(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface SqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(options?: SqlJsOptions): Promise<SqlJsStatic>;
}
