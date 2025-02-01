import LoginPortal from "../Website/LoginSystem/login-portal";
import IdentityProviderPortal from "../Website/IdentityProvider/identity-portal";
import { Router } from 'express';
import AppDatabase from "./database";
import ResourcePortal from "../Website/IdentityProvider/resource-portal";
import apiRouter from '../Website/api-router';
import staticPortal from "../Website/static-portal";
import ReactPortal from "../Website/react-portal";
import ClientApiPortal from "../Website/client-api-portal";

class GlobalScope {
    public app: Router;
    public database: AppDatabase;

    public apiRouter: Router;
    public loginPortal: LoginPortal;
    public idProviderPortal: IdentityProviderPortal;
    public resourcePortal: ResourcePortal;
    public reactPortal: ReactPortal;
    public clientApiPortal: ClientApiPortal;

    public constructor(app: Router) {
        this.app = app;
        this.database = new AppDatabase();

        this.apiRouter = apiRouter(this.app);
        this.loginPortal = new LoginPortal(this);
        this.idProviderPortal = new IdentityProviderPortal(this);
        this.resourcePortal = new ResourcePortal(this);
        this.reactPortal = new ReactPortal(this);
        this.clientApiPortal = new ClientApiPortal(this);

        // must be last
        staticPortal(this);
    }

    public async init(): Promise<void> {
        // duplicate db check - see server.ts:listen()
        await this.database.init();

        // futher init calls -> below
    }
}

export default GlobalScope;
