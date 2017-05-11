import * as express from 'express';

import authRouter from './auth';
import userRouter from './user';

export default (passport) => {

    const router = express.Router();

    router.use('/auth', authRouter(passport));
    router.use('/users', userRouter(passport));

    return router
}