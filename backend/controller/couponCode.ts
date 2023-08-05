import express, { Request, Response } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import Shop from "../model/shop";
import ErrorHandler from "../utils/ErrorHandler";
import { isSeller, RequestUser } from "../middleware/auth";
import CoupounCode, { ICouponCode } from "../model/couponCode";

const router = express.Router();

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
