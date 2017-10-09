import Promise from 'bluebird';
import mongoose from 'mongoose';
import idValidator from 'mongoose-id-validator';
import env from './env';

const MONGO_HOST = env.get('MONGO_HOST');

// Setup Mongoose to use bluebird
mongoose.Promise = Promise;

// Create Mongo connection
mongoose.connect(MONGO_HOST);

// Setup global plugins
mongoose.plugin(idValidator);

// Export
export default mongoose;
