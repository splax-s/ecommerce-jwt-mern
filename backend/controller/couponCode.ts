import express, { Request, Response } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import Shop from "../model/shop";
import ErrorHandler from "../utils/ErrorHandler";
import { isSeller, RequestUser } from "../middleware/auth";
import CoupounCode, { ICouponCode } from "../model/couponCode";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ICouponCode:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         value:
 *           type: number
 *         minAmount:
 *           type: number
 *         maxAmount:
 *           type: number
 *         shopId:
 *           type: string
 *         selectedProduct:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 * /coupon/create-coupon-code:
 *   post:
 *     summary: Create a new coupon code
 *     tags: [Coupon Codes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICouponCode'
 *     responses:
 *       201:
 *         description: Coupon code created successfully
 *       400:
 *         description: Missing required fields or duplicate coupon code name
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * tags:
 *   name: Coupon Codes
 *   description: API endpoints for managing coupon codes
 */

/**
 * @swagger
 * /coupon/create-coupon-code:
 *   post:
 *     summary: Create a new coupon code
 *     tags: [Coupon Codes]
 *     security:
 *       - sellerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: number
 *               minAmount:
 *                 type: number
 *               maxAmount:
 *                 type: number
 *               shopId:
 *                 type: string
 *               selectedProduct:
 *                 type: string
 *             example:
 *               name: SUMMER50
 *               value: 50
 *               minAmount: 100
 *               maxAmount: 500
 *               shopId: 611f2aa328a7ad001e736e89
 *               selectedProduct: TSHIRT123
 *     responses:
 *       201:
 *         description: Coupon code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 couponCode:
 *                   $ref: '#/components/schemas/ICouponCode'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: false
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /coupon/get-coupon/{id}:
 *   get:
 *     summary: Get all coupon codes of a shop
 *     tags: [Coupon Codes]
 *     security:
 *       - sellerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Shop ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 couponCodes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICouponCode'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: false
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /coupon/delete-coupon/{id}:
 *   delete:
 *     summary: Delete a coupon code
 *     tags: [Coupon Codes]
 *     security:
 *       - sellerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Coupon Code ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon code deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: false
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /coupon/get-coupon-value/{name}:
 *   get:
 *     summary: Get the value of a coupon code by its name
 *     tags: [Coupon Codes]
 *     parameters:
 *       - name: name
 *         in: path
 *         description: Coupon Code name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon code value retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 couponCode:
 *                   $ref: '#/components/schemas/ICouponCode'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: false
 *                 error:
 *                   type: string
 */


// Create coupon code
router.post(
  "/create-coupon-code",
  isSeller,
  catchAsyncErrors(async (req, res: Response) => {
    try {
      const isCoupounCodeExists = await CoupounCode.find({
        name: req.body.name,
      });

      if (isCoupounCodeExists.length !== 0) {
        return res.status(400).json({
          success: false,
          error: "Coupon code already exists!",
        });
      }

      const coupounCode = await CoupounCode.create(req.body);

      res.status(201).json({
        success: true,
        coupounCode,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  })
);

// Get all coupons of a shop
router.get(
  "/get-coupon/:id",
  isSeller,
  catchAsyncErrors(async (req: RequestUser, res: Response) => {
    try {
      const couponCodes = await CoupounCode.find({ shopId: req.seller.id });
      res.status(200).json({
        success: true,
        couponCodes,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  })
);

// Delete coupon code of a shop
router.delete(
  "/delete-coupon/:id",
  isSeller,
  catchAsyncErrors(async (req, res: Response) => {
    try {
      const couponCode = await CoupounCode.findByIdAndDelete(req.params.id);

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          error: "Coupon code doesn't exist!",
        });
      }
      res.status(200).json({
        success: true,
        message: "Coupon code deleted successfully!",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  })
);

// Get coupon code value by its name
router.get(
  "/get-coupon-value/:name",
  catchAsyncErrors(async (req: Request, res: Response) => {
    try {
      const couponCode = await CoupounCode.findOne({ name: req.params.name });

      res.status(200).json({
        success: true,
        couponCode,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  })
);

export default router;
