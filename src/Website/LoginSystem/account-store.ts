import AppDatabase from "../../Systems/database";

interface Account {
    id: number;
    discordId: string;
    name: string;
    createTime: number;
}

class AccountStore {
    private db: AppDatabase;

    public constructor(db: AppDatabase) {
        this.db = db;
    }

    public async getAccount(id: string): Promise<Account | null> {
        try {
            let result = await this.db.get<Account>('SELECT * FROM accounts WHERE discordId=:id;', {id});
            if (result != null && result.length > 0) {
                return result[0];
            }
            return null;
        } catch {
            return null;
        }
    }
}

export default AccountStore;
export {Account};
