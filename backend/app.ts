import express, { Request, Response, NextFunction } from 'express';
import ErrorHandler from './middleware/error';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc'
import * as swaggerUi from 'swagger-ui-express';
import basicAuth from 'express-basic-auth';

// import routes
import user from './controller/user';
import shop from './controller/shop';
import product from './controller/product';
import event from './controller/event';
import coupon from './controller/couponCode';
import payment from './controller/payment';
import order from './controller/order';
import conversation from './controller/conversation';
import message from './controller/message';
import withdraw from './controller/withdraw';
import chalk from 'chalk';
const logEndpoints = require('custom-logger-node')
const app = express();


const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Oshop Express API with Swagger",
      version: "0.1.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Splax",
        url: "",
        email: "shakaikhanoba@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:8000/api/v2",
      },
    ],
  components: {
    securitySchemes: {
      bearerAuth: { // name of the security scheme
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      sellerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    },
  },
  },
  apis: ["./controller/*.ts"],
};

// const basicAuthMiddleware = basicAuth({
//   users: { admin: 'password' }, // Replace 'admin' with your desired username and 'password' with your desired password
//   challenge: false, // Send a 401 Unauthorized response if authentication fails
// });

// const basicAuthMiddleware = (req: any, res: Response, next: NextFunction) => {
//   const user: any = basicAuth(req);

//   // Check if the user is authorized
//   if (!user || user.name !== 'myusername' || user.pass !== 'mypassword') {
//     res.set('WWW-Authenticate', 'Basic realm="Authentication Required"');
//     return res.status(401).send('Authentication Required');
//   }

//   // User is authorized, proceed to the next middleware
//   next();
// };

const specs = swaggerJsdoc(options);

const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend origin
  credentials: true, // This allows cookies to be sent
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(logEndpoints);

// test route
app.use("/test", (req: Request, res: Response) => {
  res.send("Hello world!");
});

// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({
    path: 'config/.env',
  });
}

// apply routes
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);
app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);

// Error Handling middleware
app.use(ErrorHandler);

export default app;
