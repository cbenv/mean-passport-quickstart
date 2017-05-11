import * as mongoose from 'mongoose';

const definition = {
    loginID: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['User', 'Admin'],
        default: 'User'
    }
};

const schema = new mongoose.Schema(definition);
const userModel = mongoose.model('User', schema);

export default userModel;