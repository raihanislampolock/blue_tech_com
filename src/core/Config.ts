import { IUserToken } from "./IUserProvider";

export interface SMTPConf {
    from: string;
    host: string,
    port: number,
    secure: boolean,
    auth: {
      user: string,
      pass: string,
    }
}

export interface PostgresConf {
    dbUser: string,
    dbHost: string,
    dbName: string,
    dbPassword: string,
    dbPort: number,
}

export interface LoginParam {
    applicationId: number,
    token: string,
    apiBaseUrl: string
}

export class Config {
    public port!: number;
    public cookieSecret!: string;
    public sessionSecret!: string;
    public authSecret!: string;
    public authSalt!: string;
    public smtp!: SMTPConf;
    public login!: LoginParam;
    public smsApiBaseUrl!: string;
    public smsApiKey!: string;
    public postgres!: PostgresConf;

    public constructor(obj: any) {
        Object.assign(this, obj); // cleaner than defineProperties
        return this.verify();
    }

    private verify(): Config {
        if (!this.port) this.port = 3000;
        return this;
    }
}