require('dotenv').config();
import * as lambda from './modules/lambda';

console.log(process.env.NODE_ENV);

// update subnet for lambda
lambda.updateSubnet();
