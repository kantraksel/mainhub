import { RateLimiterMySQL } from 'rate-limiter-flexible';
import config from '../../config';
import RateLimit from './rate-limit';

class RateLimitGlobal extends RateLimit {
    public constructor() {
        super();

        this.errorLimiter = new RateLimiterMySQL({
            storeClient: this.pool,
            ...config.globalLimits.accessLimiter,
        });
        
        this.accessLimiter = new RateLimiterMySQL({
            storeClient: this.pool,
            ...config.globalLimits.errorLimiter,
        });
    }
}

export default RateLimitGlobal;
