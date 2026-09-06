import { HttpRequest, HttpResponse, NextFunc } from '../core/Types';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Config } from '../core/Config';
import { IUserToken } from '../core/IUserProvider';

const APP_CONFIG = new Config(JSON.parse(fs.readFileSync('config.json').toString()));

export function userContext(req: HttpRequest, res: HttpResponse, next: NextFunc): void {
    const token = req.cookies?.auth_token;

    if (token) {
        try {
            const decoded = jwt.verify(token, APP_CONFIG.authSecret) as IUserToken;
            res.locals.user = decoded; // for views like p #{user.username}
            req.user = decoded;        // for controllers
        } catch (err) {
            console.error('Invalid token:', err);
            res.locals.user = null;
            req.user = null;
        }
    } else {
        res.locals.user = null;
        req.user = null;
    }

    next();
}
