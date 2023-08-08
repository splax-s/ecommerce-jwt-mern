import express, { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

/**
 * @swagger
 * components:
 *   responses:
 *     InternalServerError:
 *       description: An unknown error occurred
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpoints for managing payment
 */

/**
 * @swagger
 * /payment/process:
 *   post:
 *     summary: Create a payment intent
 *     parameters:
 *       - in: body
 *         name: amount
 *         required: true
 *         schema:
 *           type: integer
 *           description: The amount to be processed
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 client_secret:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /payment/stripeapikey:
 *   get:
 *     summary: Get the Stripe API key
 *     responses:
 *       200:
 *         description: Stripe API key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stripeApikey:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


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
          company: "oshop",
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
