const express = require("express");
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require('dotenv/config');

const app = express();

// model imports
const Product = require('./models/product');
const Category = require('./models/category');


// route imports
const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');
const usersRouter = require('./routers/users');
const ordersRouter = require('./routers/orders');

// cors config middleware
app.use(cors());
app.options('*', cors());

// application jwt middleware
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

const host = process.env.LOCALHOST_URL;
const api = process.env.API_URL;

// Middleware
app.use(express.json());
app.use(morgan('tiny'));


// Routers
app.use(`${api}/products`, productsRouter)
app.use(`${api}/categories`, categoriesRouter)
app.use(`${api}/users`, usersRouter)
app.use(`${api}/orders`, ordersRouter)



mongoose.connect(process.env.MONGO_ATLAS_CONNECTION_URL).then(() => {
    console.log("MongoDB Atlast Connection is ready. . .");
    console.log("Connected to DB: " + process.env.DB_NAME)
}).catch((err) => {
    console.log(err);
});


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(api);
    console.log("eshop nodejs server is running at: " + host);
});

