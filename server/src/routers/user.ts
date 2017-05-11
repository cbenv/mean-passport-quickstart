import * as _ from 'lodash';
import * as express from 'express';
import * as crypt from 'bcrypt';

import userModel from '../models/user';

export default (passport) => {

    const router = express.Router();

    router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
        const role = req.user.role;
        if (role === 'Admin') {
            const limit = req.query.limit || 100;
            const offset = req.query.offset || 0;
            const onSuccess = (users) => {
                res.status(200).json(users);
            };
            const onFailure = (error) => {
                res.status(503).send('Database Error');
            };
            userModel.find().limit(limit).skip(offset).exec().then(onSuccess, onFailure);
        } else {
            res.status(401).send('Unauthorized');
        }
    });

    router.get('/:userID', passport.authenticate('jwt', { session: false }), (req, res) => {
        const userID = req.params.userID;
        const role = req.user.role;
        if (req.user.id === userID || role === 'Admin') {
            const fields = '-password';
            const onSuccess = (user) => {
                if (user) {
                    res.status(200).json(user);
                } else {
                    res.status(404).send('Not Found');
                }
            };
            const onFailure = (error) => {
                res.status(503).send('Database Error');
            };
            userModel.findById(userID).select(fields).exec().then(onSuccess, onFailure);
        } else {
            res.status(401).send('Unauthorized');
        }
    });

    router.put('/:userID', passport.authenticate('jwt', { session: false }), (req, res) => {
        const userID = req.params.userID;
        const role = req.user.role;
        if (req.user.id === userID || role === 'Admin') {
            const updateUser = (update) => {
                update = _.omit(update, ['_id', 'id']);
                if (role !== 'Admin') {
                    update = _.omit(update, ['role']);
                }
                const fields = '-password';
                const options = {
                    new: true,
                    runValidators: true
                };
                const onSuccess = (user) => {
                    res.status(200).json(user);
                };
                const onFailure = (error) => {
                    if (error.code === 11000 || error.name == 'ValidationError') {
                        res.status(400).send('Bad Parameters');
                    } else {
                        res.status(503).send('Database Error');
                    }
                };
                userModel.findByIdAndUpdate(userID, update, options).select(fields).exec().then(onSuccess, onFailure);
            };
            let update = req.body;
            if (update.password) {
                const onHash = (hash) => {
                    update.password = hash;
                    updateUser(update);
                };
                crypt.hash(update.password, 10).then(onHash);
            } else {
                updateUser(update);
            }
        } else {
            res.status(401).send('Unauthorized');
        }
    });

    return router;
}