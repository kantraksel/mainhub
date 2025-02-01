import IdentityProviderStore, { Token } from "./identity-store";
import AppDatabase from '../../Systems/database';
import config from "../../config";
import ApplicationStore, { Application } from "../Stores/ApplicationStore";

interface CacheObject<T> {
    expiration: number;
    object: T;
}

interface CacheUnknown {
    expiration: number;
}

type CacheStore<T> = Map<string, CacheObject<T>>;
type UCacheStore = Map<string, CacheUnknown>;

class TokenStore {
    private store: IdentityProviderStore;
    private appStore: ApplicationStore;
    private appCache: CacheStore<Application>;
    private codeCache: CacheStore<Token>;
    private accessCache: CacheStore<Token>;
    private refreshCache: CacheStore<Token>;
    private expiration: number;
    private task: NodeJS.Timeout;

    public constructor(db: AppDatabase) {
        this.store = new IdentityProviderStore(db);
        this.appStore = new ApplicationStore(db);
        this.appCache = new Map();
        this.codeCache = new Map();
        this.accessCache = new Map();
        this.refreshCache = new Map();

        this.expiration = config.tokenCache.expiration;
        this.task = setInterval(() => {
            this.cleanCache();
        }, config.tokenCache.checkPeriod);

        global.shutdownPool.add(this);
    }

    public shutdown(): void {
        clearInterval(this.task);
    }

    public async getApplication(id: string): Promise<Application | null> {
        let value = this.appCache.get(id);
        if (value == null) {
            let app = await this.appStore.getApplication(id);
            if (app != null) {
                this.appCache.set(id, {
                    expiration: this.getExpiration(),
                    object: app,  
                });
            }
            return app;
        }
        
        return value.object;
    }

    public async addCode(obj: Token): Promise<void> {
        this.codeCache.set(`${obj.id}-${obj.uid}`, {
            expiration: this.getExpiration(),
            object: obj,
        });
        await this.store.addCode(obj);
    }

    public async getCode(id: string, uid: string): Promise<Token | null> {
        let key = `${id}-${uid}`;
        let value = this.codeCache.get(key);
        if (value == null) {
            let token = await this.store.getCode(id, uid);
            if (token != null) {
                this.codeCache.set(key, {
                    expiration: this.getExpiration(),
                    object: token,
                });
            }
            return token;
        }
        
        return value.object;
    }

    public async deleteCode(id: string, uid: string): Promise<void> {
        this.codeCache.delete(`${id}-${uid}`);
        await this.store.deleteCode(id, uid);
    }

    public async addAccessToken(obj: Token): Promise<void> {
        this.accessCache.set(`${obj.id}-${obj.uid}`, {
            expiration: this.getExpiration(),
            object: obj,
        });
        await this.store.addAccessToken(obj);
    }

    public async getAccessToken(id: string, uid: string): Promise<Token | null> {
        let key = `${id}-${uid}`;
        let value = this.accessCache.get(key);
        if (value == null) {
            let token = await this.store.getAccessToken(id, uid);
            if (token != null) {
                this.accessCache.set(key, {
                    expiration: this.getExpiration(),
                    object: token,
                });
            }
            return token;
        }
        
        return value.object;
    }

    public async deleteAccessToken(id: string, uid: string): Promise<void> {
        this.accessCache.delete(`${id}-${uid}`);
        await this.store.deleteAccessToken(id, uid);
    }

    public async addRefreshToken(obj: Token): Promise<void> {
        this.refreshCache.set(`${obj.id}-${obj.uid}`, {
            expiration: this.getExpiration(),
            object: obj,
        });
        await this.store.addRefreshToken(obj);
    }

    public async getRefreshToken(id: string, uid: string): Promise<Token | null> {
        let key = `${id}-${uid}`;
        let value = this.refreshCache.get(key);
        if (value == null) {
            let token = await this.store.getRefreshToken(id, uid);
            if (token != null) {
                this.refreshCache.set(key, {
                    expiration: this.getExpiration(),
                    object: token,
                });
            }
            return token;
        }
        
        return value.object;
    }

    public async deleteRefreshToken(id: string, uid: string): Promise<void> {
        this.refreshCache.delete(`${id}-${uid}`);
        await this.store.deleteRefreshToken(id, uid);
    }

    public async deleteExpiredTokens(): Promise<void> {
        const now = Date.now() / 1000;
        const dbQuery = Promise.all([
            this.store.deleteExpiredCodes(now),
            this.store.deleteExpiredAccessTokens(now),
            this.store.deleteExpiredRefreshTokens(now),
        ]);

        const func = (value: CacheObject<Token>, key: string, map: UCacheStore): void => {
            if (value.object.expires <= now) {
                map.delete(key);
            }
        };

        this.codeCache.forEach(func);
        this.accessCache.forEach(func);
        this.refreshCache.forEach(func);

        await dbQuery;
    }

    private getExpiration(): number {
        return Date.now() + this.expiration;
    }

    private cleanCache(): void {
        let now = Date.now();
        let func = (value: CacheUnknown, key: string, map: UCacheStore): void => {
            if (value.expiration <= now) {
                map.delete(key);
            }
        };

        this.appCache.forEach(func);
        this.codeCache.forEach(func);
        this.accessCache.forEach(func);
        this.refreshCache.forEach(func);
    }
}

export default TokenStore;
