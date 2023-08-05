import express, { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import { isSeller, isAuthenticated, isAdmin } from "../middleware/auth";
import Product from "../model/product";
import Order from "../model/order";
import Shop from "../model/shop";

const router = express.Router();

interface Review {
  _id: string; // Add the _id property
  user: User; // Assuming the user property is of type User
  rating: number;
  comment: string;
  productId: string;
  createdAt: Date; // Add any other required properties
}

interface User {
  _id?: string;
  // Add other properties of the user if available
}

// Extend the default Request type with our custom User
interface AuthenticatedRequest extends Request {
  user?: User;
}

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shopId = req.body.shopId;
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
          const result = await cloudinary.v2.uploader.upload(images[i], {
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

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
     if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      for (let i = 0; 1 < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          product.images[i].public_id
        );
      }

      // Remove the product from the database
      await Product.deleteOne({ _id: req.params.id });

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found with this id", 404));
      }

      const review = {
        user,
        rating,
        comment,
        productId,
        createdAt: new Date(), // Add the createdAt property here
      };


      let isReviewed = false;
      let totalRatings = 0;
      let numReviews = product.reviews.length;

      for (const rev of product.reviews as Review[]) {
        totalRatings += rev.rating || 0;
        if (rev.user._id === req.user?._id) {
          if (typeof rating === 'number') {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
            isReviewed = true;
            totalRatings += rating;
          }
        }
      }

      if (!isReviewed) {
        product.reviews.push(review);
        if (typeof rating === 'number') {
          totalRatings += rating;
          numReviews++;
        }
      }

      product.ratings = totalRatings / numReviews;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);


// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);
export default router;
