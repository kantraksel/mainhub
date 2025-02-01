import { Account } from "../Website/LoginSystem/account-store";
import LoginError from "../Website/LoginSystem/login-error";
import RateLimit from "../Systems/Rate/rate-limit";

declare module "express-session" {
    interface Session {
        ACCOUNT: Account | null;
        AUTH_ERROR: LoginError | null;
        AUTH_STATE: string | null;
    }
}

declare module "express" {
    interface Response {
        rateLimit?: RateLimit;
        globalRateLimit?: RateLimit;
    }
}
