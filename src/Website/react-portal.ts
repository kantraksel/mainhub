import { readFile } from 'fs';
import express, { NextFunction, Request, Response, Router } from 'express';
import GlobalScope from '../Systems/global-scope';
import config from '../config';
import validators from '../Systems/validators';
import TokenStore from './IdentityProvider/token-store';

interface ManifestEntry {
    file: string;
    src?: string;
    isEntry?: boolean;
    imports?: string[];
    css?: string[];
}

interface SiteInfo {
    core: string[];
    site: string;
    css: string;
}

interface PersonalQuery {
    service?: string;
}

class ReactPortal {
    private mainInfo?: SiteInfo;
    private dashboardInfo?: SiteInfo;
    private personalInfo?: SiteInfo;
    private idStore: TokenStore;

    public constructor(global: GlobalScope) {
        const {app, database} = global;
        this.idStore = new TokenStore(database);
    
        this.loadManifest();
        this.registerHandlers(app);
        logger.info('Constructed ReactPortal');
    }

    private loadManifest(): void {
        readFile(config.staticFiles.reactManifest, 'utf-8', (err: unknown, data: string) => {
            if (err) throw (err as Error);

            const obj = JSON.parse(data) as Record<string, ManifestEntry>;
            this.mainInfo = this.resolveEntry(obj, 'index.html');
            this.dashboardInfo = this.resolveEntry(obj, "dashboard/index.html");
            this.personalInfo = this.resolveEntry(obj, "personal/index.html");
        });
    }

    private resolveEntry(manifest: Record<string, ManifestEntry>, file: string): SiteInfo {
        const entry = manifest[file];
        const object = {
            core: [] as string[],
            site: entry.file,
            css: '',
        };

        if (entry.imports != null && entry.imports.length > 0) {
            for (let i = 0; i < entry.imports.length; i++) {
                let addon = manifest[entry.imports[i]];
                object.core.push(addon.file);

                if (object.css === '' && addon.css != null && addon.css.length > 0) {
                    object.css = addon.css[0];
                }
            }
        } else {
            throw new Error(`ReactPortal: core entry is missing in ${file}`);
        }

        if (object.css === '') {
            throw new Error(`ReactPortal: css entry is missing in ${file}`);
        }

        return object;
    }

    private registerHandlers(app: Router): void {
        app.use('/assets', express.static(config.staticFiles.react, {
            dotfiles: 'ignore',
            extensions: false,
            fallthrough: true,
            index: false,
            redirect: true,
        }));
    
        app.get('/', (req: Request, res: Response) => {
            if (req.session.ACCOUNT != null) {
                res.redirect('/personal/');
                return;
            }

            res.render('main', {
                proxyPath: config.proxyEnable ? config.proxyPath : '',
                reactInfo: this.mainInfo,
                authError: req.session.AUTH_ERROR,
            });
        });

        app.get('/dashboard/', (req: Request, res: Response) => {
            if (req.session.ACCOUNT == null) {
                res.redirect('/');
                return;
            }
            
            res.render('dashboard', {
                proxyPath: config.proxyEnable ? config.proxyPath : '',
                reactInfo: this.dashboardInfo,
                account: req.session.ACCOUNT,
            });
        });

        app.get('/personal/', (req: Request, res: Response, next: NextFunction) => {
            this.onGetPersonal(req, res).catch(next);
        });
    }

    private async onGetPersonal(req: Request, res: Response): Promise<void> {
        if (req.session.ACCOUNT == null) {
            res.redirect('/');
            return;
        }

        let serviceInfo = null;
        const query = req.query as PersonalQuery;
        if (query.service != null) {
            if (!validators.isIdValid(query.service)) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }

            const app = await this.idStore.getApplication(query.service);
            if (app == null) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }

            serviceInfo = { name: app.name, url: app.login_url };
        }

        res.render('personal', {
            proxyPath: config.proxyEnable ? config.proxyPath : '',
            reactInfo: this.personalInfo,
            account: req.session.ACCOUNT,
            serviceInfo,
        });
    }
}

export default ReactPortal;
