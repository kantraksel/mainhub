let config = {
    server: {
        ip: '127.0.0.1',
        port: 8080,
    },

    // proxy_pass should pass full path
    // site wont load at all if proxy is misconfigured
    // discordAuthCallback should be changed accordingly
    // static react site should use the path as well
    proxyEnable: false,
    proxyPath: '/test',

    staticFiles: {
        enabled: true,
        path: 'html/static',
        ejs: 'html/ejs',
        react: 'html/react/dist/assets',
        reactManifest: 'html/react/dist/manifest.json',
    },

    sessionCookie: 'mainhub',
    sessionSecure: false,
    sessionStore: {
        clearExpired: true,
        schema: {
            tableName: 'sessions',
        },
        expiration:  1000 * 3600 * 24 * 14, // 14 days
        checkExpirationInterval: 1000 * 3600 * 24, // 1 day
    },
    sessionMaxClientAge: 1000 * 3600 * 24 * 14, // 14 days
    sessionCache: {
        checkPeriod: 1000 * 3600 * 1, // 1 hour
        ttl: 1000 * 3600 * 24, // 1 day
    },
    tokenCache: {
        checkPeriod: 1000 * 3600 * 1, // 1 hour
        expiration: 1000 * 3600 * 24, // 1 day
    },

    discordId: 'XXX',
    discordAuthCallback: 'http://127.0.0.1:8080/authorize',

    logFormat: '[:date[iso]] :remote-addr ":sessionId" ":method :url" :status :res[content-length] :response-time ":user-agent"',
    accessLogFile: 'logs/access.log',
    errorLogFile: 'logs/error.log',
    logFileRotateInterval: '30d',
    runtimeLogFile: 'logs/runtime.log',

    database: {
        host: 'localhost',
        port: 3306,
        //uncomment if you want to use unix socket instead of tcp socket
        //socketPath: 'unix.socket',
        user: 'mainhub',
        database: 'mainhub',
        connectionLimit: 500,
        namedPlaceholders: true,
    },

    whitelistedIp: '127.0.0.1',
    apiLimits: {
        errorLimiter: {
            dbName: 'mainhub',
            keyPrefix: 'limit_api_errors',
            points: 100,
            duration: 60,
            blockDuration: 60 * 60 * 24 * 30,
        },
        accessLimiter: {
            dbName: 'mainhub',
            keyPrefix: 'limit_api_access',
            points: 10,
            duration: 1,
            blockDuration: 3600,
        },
        endpointLimiter: {
            points: 600,
            duration: 60,
        },
    },
    globalLimits: {
        errorLimiter: {
            dbName: 'mainhub',
            keyPrefix: 'limit_global_errors',
            points: 1000,
            duration: 60,
            blockDuration: 60 * 60 * 24 * 30,
        },
        accessLimiter: {
            dbName: 'mainhub',
            keyPrefix: 'limit_global_access',
            points: 50,
            duration: 1,
            blockDuration: 60,
        },
    },
    authorizeLimit: {
        points: 600,
        duration: 60,
    },

    identityAuthority: {
        codeExpiresIn: 3600, //1h
        tokenExpiresIn: 604800, //7d

        checkInterval: 1000 * 3600, //1h
    },
};

export default config;
