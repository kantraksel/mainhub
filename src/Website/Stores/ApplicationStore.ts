import AppDatabase from '../../Systems/database';

// used when getting AppConnection
type DbRecord = Record<string, string | undefined>;

export interface Application {
    id: string;
    secret: string;
    redirect_uri: string;
    name: string;
    login_url: string;
    id2: string;
}

export interface AppConnection {
    id: number;
    connId: string;
}

export default class ApplicationStore {
    private db: AppDatabase;

    public constructor(db: AppDatabase) {
        this.db = db;
    }

    public async getApplication(id: string): Promise<Application | null> {
        try {
            const result = await this.db.get<Application>('SELECT * FROM application WHERE id=:id;', {id});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    public async getApplications(): Promise<Application[] | null> {
        try {
            const result = await this.db.get<Application>('SELECT * FROM application');
            if (result != null) {
                return result;
            }
            return null;
        } catch {
            return null;
        }
    }

    public async getAppConnectionByUserId(id: number, service: string): Promise<AppConnection | null> {
        try {
            const result = await this.db.get<DbRecord>('SELECT * FROM connected_services WHERE id=:id;', {id});
            if (result != null && result.length > 0) {
                const connId = result[0][service];
                if (connId != null && connId.length > 0) {
                    return {id, connId};
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    public async getAppConnectionsByUserId(id: number): Promise<DbRecord | null> {
        try {
            const result = await this.db.get<DbRecord>('SELECT * FROM connected_services WHERE id=:id;', {id});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }
}
