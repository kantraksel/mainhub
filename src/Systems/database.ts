import { Pool, createPool } from 'mysql2';
import { Pool as PoolAsync } from 'mysql2/promise';
import config from '../config';

class AppDatabase {
    public pool: Pool;
    public asyncPool: PoolAsync;

    public constructor() {
        this.pool = createPool({
            password: process.env.MYSQL_PASSWORD,
            ...config.database,
        });

        this.asyncPool = this.pool.promise();
        global.shutdownPool.add(this);
        logger.info('Constructed AppDatabase');
    }

    public async init(): Promise<void> {
        const conn = await this.asyncPool.getConnection();
        await conn.ping();
        conn.release();
        logger.info('Initialized AppDatabase');
    }

    public async shutdown(): Promise<void> {
        try {
            await this.asyncPool.end();
        } catch {

        }
        logger.info('Shutdown AppDatabase');
    }

    public async get<T>(sql: string, params?: unknown): Promise<T[] | null> {
        const rows = await this.asyncPool.execute(sql, params);
        const row = rows[0];
        if (row instanceof Array) {
            return row as T[];
        }
        return null;
    }

    public async run(sql: string, params: unknown): Promise<void> {
        await this.asyncPool.execute(sql, params);
    }
}

export default AppDatabase;
