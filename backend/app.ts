import express, { Request, Response, NextFunction } from 'express';
import ErrorHandler from './middleware/error';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

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

const app = express();

const logEndpoints = (req: Request, res: Response, next: NextFunction) => {
 const start = process.hrtime();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);
    const statusCode = res.statusCode;

    let statusColor = chalk.bgGreen;
    if (statusCode >= 500) statusColor = chalk.bgRed;
    else if (statusCode >= 400) statusColor = chalk.bgYellow;
    else if (statusCode >= 300) statusColor = chalk.bgCyan;

    let statusColorBg = chalk.green;
    if (statusCode >= 500) statusColorBg = chalk.red;
    else if (statusCode >= 400) statusColorBg = chalk.yellow;
    else if (statusCode >= 300) statusColorBg = chalk.cyan;

    let methodColor = chalk.green;
    if (method >= 'POST') methodColor = chalk.green;
    else if (method >= 'PATCH') methodColor = chalk.yellow;
    else if (method >= 'GET') methodColor = chalk.cyan;
    else if (method >= 'DELETE') methodColor = chalk.red;
    else if (method >= 'PUT') methodColor = chalk.magenta;

    const logLine = [
      chalk.gray('[' + new Date().toISOString() + ']'),
      methodColor(method),
      originalUrl,
      statusColorBg(statusCode.toString()),
      chalk.magenta(duration + 'ms'),
      chalk.gray('-'),
      chalk.green(ip)
    ].join(' ');

    // Add a 20% color bar to the log line, matching the status code color
    const colorBarLength = Math.floor(logLine.length * 0.14);
    const colorBar = statusColor(' '.repeat(colorBarLength));

    console.log(logLine + " " + colorBar);
  });

  next();
};

app.use(cors({
  origin: ['*'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
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
