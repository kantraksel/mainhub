import { Request, Response } from 'express';
import config from '../../config';

interface Config {
    points: number;
    duration: number;
}

class RouteLimit {
    private limit: number;
    private hits: number;
    private limitDuration: number;
    private resetTime: number;

    public constructor(cfg: Config) {
        this.hits = 0;
        this.limit = cfg.points;
        this.limitDuration = cfg.duration * 1000;
        this.resetTime = Date.now() + this.limitDuration;
    }

    public async consumeAccess(req: Request, res: Response): Promise<boolean> {
        if (req.ip === config.whitelistedIp) {
            return true;
        }

        const now = Date.now();
        if (this.resetTime < now) {
            this.resetTime = now + this.limitDuration;
            this.hits = 0;
        }

        if (this.hits >= this.limit) {
            try {
                await res.globalRateLimit!.consumeError(req, res);
            } catch {
            }

            res.setHeader('Retry-After', (this.resetTime - now) / 1000);
            res.status(429).send('429 Too Many Requests');
            return false;
        }

        this.hits++;
        return true;
    }
}

export default RouteLimit;
