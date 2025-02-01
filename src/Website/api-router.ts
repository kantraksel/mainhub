import { Router } from 'express';
import RateLimitApi from '../Systems/Rate/rate-limit-api';
import {rateLimitMiddleware} from '../Systems/Rate/rate-limit';

function apiRouter(app: Router) : Router {
    // eslint-disable-next-line new-cap
    let r = Router();
    app.use('/api', r);

    r.use(rateLimitMiddleware(new RateLimitApi()));
    return r;
}

export default apiRouter;
