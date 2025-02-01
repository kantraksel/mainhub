import { NextFunction, Request, Response } from 'express';
import { RateLimiterMySQL, RateLimiterRes } from 'rate-limiter-flexible';
import { Pool, createPool } from 'mysql2';
import config from '../../config';

interface HttpError {
    code: number;
    message: string;
}

class RateLimit {
    protected pool: Pool;
    protected errorLimiter!: RateLimiterMySQL;
    protected accessLimiter!: RateLimiterMySQL;
    protected showAccessLimit: boolean;

    protected constructor() {
        this.pool = createPool({
            password: process.env.MYSQL_PASSWORD,
            ...config.database,
        });

        this.showAccessLimit = false;
        global.shutdownPool.add(this);
    }

    public shutdown(): void {
        this.pool.end();
    }

    public async consumeAccess(req: Request, res: Response): Promise<boolean> {
        if (req.ip === config.whitelistedIp) {
            return true;
        }
        try {
            let info = await this.accessLimiter.consume(req.ip);
            this.setHeaders(res, info);
            return true;
        } catch (error: unknown) {
            this.setHeaders(res, error as RateLimiterRes);
            this.rejectRequest(res, error as RateLimiterRes);
            return false;
        }
    }

    public async consumeError(req: Request, res: Response, error?: number | HttpError): Promise<boolean> {
        if (req.ip !== config.whitelistedIp) {
            try {
                await this.errorLimiter.consume(req.ip);
            } catch (error: unknown) {
                this.rejectRequest(res, error as RateLimiterRes);
                return false;
            }
        }

        if (error != null) {
            if (typeof error == 'number') {
                res.status(error).end();
            } else {
                res.status(error.code).send(error.message);
            }
        }
        return true;
    }

    public async applyErrorLimit(req: Request, res: Response): Promise<boolean> {
        let info = await this.errorLimiter.get(req.ip);
        if (info != null && info.remainingPoints == 0) {
            this.rejectRequest(res, info);
            return true;
        }

        return false;
    }

    private setHeaders(res: Response, info: RateLimiterRes): void {
        if (!this.showAccessLimit) {
            return;
        }
        res.setHeader('X-RateLimit-Limit', info.remainingPoints + info.consumedPoints);
        res.setHeader('X-RateLimit-Remaining', info.remainingPoints);
        res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + info.msBeforeNext) / 1000));
    }

    private rejectRequest(res: Response, info: RateLimiterRes): void {
        res.setHeader('Retry-After', info.msBeforeNext / 1000);
        res.status(429).send('429 Too Many Requests');
    }
}

function rateLimitMiddleware(rateLimit: RateLimit): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async function(req: Request, res: Response, next: NextFunction): Promise<void> {
        res.rateLimit = rateLimit;
        if (res.globalRateLimit == null) {
            res.globalRateLimit = rateLimit;
        }

        if (await res.rateLimit.applyErrorLimit(req, res) || !await res.rateLimit.consumeAccess(req, res)) {
            return;
        }
    
        next();
    };
}

export default RateLimit;
export {rateLimitMiddleware};
