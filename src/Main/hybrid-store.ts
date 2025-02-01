import { SessionData, Store } from "express-session";
import * as session from 'express-session';
import mysqlStore, { MySQLStore } from 'express-mysql-session';
import memoryStore from 'memorystore';
import config from "../config";
import AppDatabase from "../Systems/database";

class HybridStore extends Store {
    private mysql: MySQLStore;
    private memory: session.MemoryStore;

    public constructor(database: AppDatabase) {
        super();

        const MySqlStore = mysqlStore(session);
        this.mysql = new MySqlStore(config.sessionStore, database.pool);

        const MemoryStore = memoryStore(session.default);
        this.memory = new MemoryStore({
            noDisposeOnSet: true,
            ...config.sessionCache,
        });
    }

    public close(callback: () => void): void {
        this.mysql.close(callback);
    }

    public get(sid: string, callback: (err: unknown, session?: SessionData | null) => void): void {
        this.memory.get(sid, (err: unknown, session?: SessionData | null) => {
            if (err != null || session != null) {
                callback(err, session);
                return;
            }

            this.mysql.get(sid, (err: unknown, session?: SessionData | null) => {
                if (session != null) {
                    this.memory.set(sid, session);
                }

                callback(err, session);
            });
        });
    }

    public set(sid: string, session: SessionData, callback?: (err?: unknown) => void): void {
        this.memory.set(sid, session, (err?: unknown) => {
            this.mysql.set(sid, session, (err2: unknown) => {
                if (callback == null) {
                    return;
                }
                if (err2 != null) {
                    callback(err2);
                } else {
                    callback(err);
                }
            });
        });
    }

    public destroy(sid: string, callback?: (err?: unknown) => void): void {
        this.memory.destroy(sid, (err: unknown) => {
            this.mysql.destroy(sid, (err2: unknown) => {
                if (callback == null) {
                    return;
                }
                if (err2 != null) {
                    callback(err2);
                } else {
                    callback(err);
                }
            });
        });
    }

    public touch(sid: string, session: SessionData, callback?: () => void): void {
        this.memory.touch(sid, session, () => {
            this.mysql.touch(sid, session, (_error: unknown) => {
                if (callback != null) {
                    callback();
                }
            });
        });
    }
}

export default HybridStore;
