import * as express from 'express';
import * as _ from 'lodash';
import * as crypt from 'bcrypt';
import * as JWT from 'jsonwebtoken';

import userModel from '../models/user';

const config = require('../../config.json');

export default (passport) => {

    const router = express.Router();

    router.post('/login', (req, res) => {
        const credentials = req.body;
        const onFetch = (user) => {
            if (!user) {
                res.status(401).send('Unauthorized');
            }
            const onComparison = (match) => {
                if (match) {
                    const secret = config.passport.secret;
                    const options = _.pick(config.passport, ['algorithm', 'issuer', 'audience', 'expiresIn']);
                    const token = JWT.sign({userID: user.id}, secret, options);
                    user = _.pick(user, ['loginID', 'email']);
                    res.status(200).cookie('JWT', token).json(user);
                } else {
                    res.status(401).send('Unauthorized');
                }
            };
            crypt.compare(credentials.password, user.password).then(onComparison);
        };
        const onFailure = (error) => {
            res.status(503).send('Database Error');
        };
        userModel.findOne({loginID: credentials.loginID}).exec().then(onFetch, onFailure);
    });

    router.post('/register', (req, res) => {
        const credentials = req.body;
        const onHash = (hash) => {
            const onCreation = (user) => {
                user = _.pick(user, ['loginID', 'email']);
                res.status(200).json(user);
            };
            const onFailure = (error) => {
                if (error.code === 11000 || error.name == 'ValidationError') {
                    res.status(400).send('Bad Parameters');
                } else {
                    res.status(503).send('Database Error');
                }
            };
            const document = {
                loginID: credentials.loginID,
                password: hash,
                email: credentials.email
            };
            userModel.create(document).then(onCreation, onFailure);
        };
        crypt.hash(credentials.password, 10).then(onHash);
    });

    router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
        const user = _.omit(req.user, ['password']);
        res.status(200).json(user);
    });

    router.post('/logout', (req, res) => {
        res.clearCookie('JWT').status(301).redirect('/');
    });

    return router;
}