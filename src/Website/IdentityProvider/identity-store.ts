import AppDatabase from '../../Systems/database';

interface Token {
    id: string;
    uid: string;
    accountId: number;
    scope: string;
    expires: number;
}

class IdentityProviderStore {
    private db: AppDatabase;

    public constructor(db: AppDatabase) {
        this.db = db;
    }

    public async addCode(obj: Token): Promise<void> {
        let params = {id: obj.id, uid: obj.uid, accountId: obj.accountId, scope: obj.scope, expires: obj.expires};
        await this.db.run('INSERT INTO code (id, uid, accountId, scope, expires) VALUES(:id, :uid, :accountId, :scope, :expires);', params);
    }

    public async getCode(id: string, uid: string): Promise<Token | null> {
        try {
            let result = await this.db.get<Token>('SELECT * FROM code WHERE id=:id AND uid=:uid;', {id, uid});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    public async deleteCode(id: string, uid: string): Promise<void> {
        await this.db.run('DELETE FROM code WHERE id=:id AND uid=:uid;', {id, uid});
    }

    public async addAccessToken(obj: Token): Promise<void> {
        let params = {id: obj.id, uid: obj.uid, accountId: obj.accountId, scope: obj.scope, expires: obj.expires};
        await this.db.run('INSERT INTO access_token (id, uid, accountId, scope, expires) VALUES(:id, :uid, :accountId, :scope, :expires);', params);
    }

    public async getAccessToken(id: string, uid: string): Promise<Token | null> {
        try {
            let result = await this.db.get<Token>('SELECT * FROM access_token WHERE id=:id AND uid=:uid;', {id, uid});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    public async deleteAccessToken(id: string, uid: string): Promise<void> {
        await this.db.run('DELETE FROM access_token WHERE id=:id AND uid=:uid;', {id, uid});
    }

    public async addRefreshToken(obj: Token): Promise<void> {
        let params = {id: obj.id, uid: obj.uid, accountId: obj.accountId, scope: obj.scope, expires: obj.expires};
        await this.db.run('INSERT INTO refresh_token (id, uid, accountId, scope, expires) VALUES(:id, :uid, :accountId, :scope, :expires);', params);
    }

    public async getRefreshToken(id: string, uid: string): Promise<Token | null> {
        try {
            let result = await this.db.get<Token>('SELECT * FROM refresh_token WHERE id=:id AND uid=:uid;', {id, uid});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    public async deleteRefreshToken(id: string, uid: string): Promise<void> {
        await this.db.run('DELETE FROM refresh_token WHERE id=:id AND uid=:uid;', {id, uid});
    }

    public async deleteExpiredCodes(expires: number): Promise<void> {
        try {
            await this.db.run('DELETE FROM code WHERE expires<=:expires', {expires});
        } catch {
        }
    }

    public async deleteExpiredAccessTokens(expires: number): Promise<void> {
        try {
            await this.db.run('DELETE FROM access_token WHERE expires<=:expires', {expires});
        } catch {
        }
    }

    public async deleteExpiredRefreshTokens(expires: number): Promise<void> {
        try {
            await this.db.run('DELETE FROM refresh_token WHERE expires<=:expires', {expires});
        } catch {
        }
    }
}

export default IdentityProviderStore;
export { Token };
