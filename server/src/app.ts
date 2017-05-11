import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';

import Authenticator from './authenticator';
import router from './routers/main';

const config = require('../config.json');

class App 
{
    private setupVariables = function()
    {
        this.env = process.env.NODE_ENV || config.node.env;
        this.host = process.env.OPENSHIFT_NODEJS_IP || config.node.host;
        this.port = process.env.OPENSHIFT_NODEJS_PORT || config.node.port;
        this.mongodb = process.env.OPENSHIFT_MONGODB_DB_URL || config.node.database;
        this.passport = Authenticator.getPassport();
        this.clientDir = path.join(__dirname + '/../../client/dist');
    };
    private configureServer = function() 
    {
        const app = express();

        app.use(express.static(this.clientDir));
        app.use(bodyParser.json());
        app.use(cookieParser());
        app.use(this.passport.initialize());
        app.use('/api', router(this.passport));

        this.http = http.createServer(app);
    };
    public initialize = function() 
    {
        this.setupVariables();
        this.configureServer();
    };
    public start = function()
    {
        mongoose.connect(this.mongodb);
        this.http.listen(this.port, this.host);
        console.log(`Application is running at ${this.host}:${this.port}`);
    };
}

const app = new App();
app.initialize();
app.start();