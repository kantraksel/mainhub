import { RateLimiterMySQL } from 'rate-limiter-flexible';
import config from '../../config';
import RateLimit from './rate-limit';

class RateLimitApi extends RateLimit {
    public constructor() {
        super();

        this.errorLimiter = new RateLimiterMySQL({
            storeClient: this.pool,
            ...config.apiLimits.accessLimiter,
        });
        
        this.accessLimiter = new RateLimiterMySQL({
            storeClient: this.pool,
            ...config.apiLimits.errorLimiter,
        });

        this.showAccessLimit = true;
    }
}

export default RateLimitApi;
