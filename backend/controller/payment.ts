import express, { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

// Route to create a payment intent
router.post(
  "/process",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;

      const myPayment = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          company: "splax",
        },
      });

      res.status(200).json({
        success: true,
        client_secret: myPayment.client_secret,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// Route to get the Stripe API key
router.get(
  "/stripeapikey",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
    } catch (error) {
      return next(error);
    }
  })
);

export default router;
