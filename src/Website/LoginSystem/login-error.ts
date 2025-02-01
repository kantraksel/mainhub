// interface of AuthorizationError, ResourceError and any other underlying Error
interface DiscordError {
    name: string;
    code?: string;
    statusCode?: number;
    toString(): string;
}

interface Result {
    error?: DiscordError;
    cancelled: boolean;
}

type AuthErrorType = "NO_ACCOUNT" | "DISCORD_AUTH_ERROR" | "DISCORD_RESOURCE_ERROR" | "AUTH_CANCEL" | null;

class LoginError {
    public type: AuthErrorType;

    public error?: string;
    public cancelByUser: boolean;
    public statusCode?: number;
    public code?: string;

    public constructor(discord: Result | null, noAccount: boolean) {
        this.type = null;
        this.cancelByUser = false;

        if (discord != null) {
            this._evaluateDiscordError(discord);
        }
        
        if (noAccount) {
            this.type = "NO_ACCOUNT";
        }
    }

    private _evaluateDiscordError(discord: Result): void {
        if (discord.error != null) {
            let obj = discord.error;
            if (obj.name === 'ResourceError') {
                this.type = "DISCORD_RESOURCE_ERROR";
                this.statusCode = obj.statusCode;
            } else {
                this.type = "DISCORD_AUTH_ERROR";
                this.code = obj.code;
            }
            this.error = obj.toString();
        }

        if (discord.cancelled) {
            this.type = "AUTH_CANCEL";
            this.cancelByUser = true;
        }
    }
}

export default LoginError;
