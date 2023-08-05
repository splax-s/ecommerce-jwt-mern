import express, { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import Shop from "../model/shop";
import Event, { IEvent } from "../model/event";
import ErrorHandler from "../utils/ErrorHandler";
import { isSeller, isAdmin, isAuthenticated } from "../middleware/auth";
import cloudinary, { UploadApiResponse } from "cloudinary";

const router = express.Router();

// create event
router.post(
  "/create-event",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shopId: string = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images: string[] = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        const imagesLinks: { public_id: string; url: string }[] = [];

        for (let i = 0; i < images.length; i++) {
          const result: UploadApiResponse = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        const productData = req.body;
        productData.images = imagesLinks;
        productData.shop = shop;

        const event = await Event.create(productData);

        res.status(201).json({
          success: true,
          event,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all events
router.get("/get-all-events", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await Event.find();
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error, 400));
  }
});

// get all events of a shop
router.get(
  "/get-all-events/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await Event.find({ shopId: req.params.id });

      res.status(200).json({
        success: true,
        events,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete event of a shop
router.delete(
  "/delete-shop-event/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return next(new ErrorHandler("Event is not found with this id", 404));
      }

      for (let i = 0; i < event.images.length; i++) {
        const result: UploadApiResponse = await cloudinary.v2.uploader.destroy(
          event.images[i].public_id
        );
        // Handle any errors or log them if necessary
        if (result.result !== "ok") {
          console.error("Failed to delete image:", event.images[i].public_id);
        }
      }

      await Event.deleteOne({ _id: event._id });

      res.status(200).json({
        success: true,
        message: "Event Deleted successfully!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all events --- for admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await Event.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        events,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

export default router;
