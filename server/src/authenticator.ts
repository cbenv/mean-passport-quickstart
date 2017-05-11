import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';

import userModel from './models/user';

const config = require('../config.json');

export default class Authenticator
{
    public static getPassport = function()
    {
        const fromCookie = () => {
            return (req) => {
                return (req && req.cookies) ? req.cookies['JWT'] : null;
            };
        };
        const options = {
            secretOrKey: config.passport.secret,
            algorithms: [config.passport.algorithm],
            issuer: config.passport.issuer,
            audience: config.passport.audience,
            jwtFromRequest: fromCookie()
        };
        const verify = (payload, done) => {
            const onSuccess = (user) => {
                done(null, user ? user : false);
            };
            const onFailure = (error) => {
                done(error, false);
            };
            userModel.findById(payload.userID).exec().then(onSuccess, onFailure);
        };
        const scheme = new passportJWT.Strategy(options, verify);
        passport.use(scheme);

        return passport;
    }
}