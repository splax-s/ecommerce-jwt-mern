import express, { Request, Response, NextFunction } from "express";
import cloudinary, { UploadApiResponse } from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import { isAuthenticated, isSeller, isAdmin } from "../middleware/auth";
import Order, { IOrder } from "../model/order";
import Shop, { IShop } from "../model/shop";
import Product from "../model/product";

const router = express.Router();

interface RequestWithSeller extends Request {
  seller?: IShop; // Replace 'IShop' with the actual type of the seller property
}

// create new order
router.post(
  "/create-order",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      //   group cart items by shopId
      const shopItemsMap = new Map<string, IOrder["cart"]>();

      for (const item of cart) {
        const shopId = item.shopId;
        const itemsForShop = shopItemsMap.get(shopId) || []; // Initialize an empty array if shopId is not found
        itemsForShop.push(item);
        shopItemsMap.set(shopId, itemsForShop);
      }

      // create an order for each shop
      const orders: IOrder[] = [];

      for (const [shopId, items] of shopItemsMap) {
        const order: IOrder = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
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

// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders: IOrder[] = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
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

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders: IOrder[] = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
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

// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const order: IOrder | null = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        for (const o of order.cart) {
          await updateOrder(o._id, o.qty);
        }
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = new Date()
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * 0.10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id: string, qty: number) {
        const product = await Product.findById(id);

       if (product && product.sold_out !== undefined) {
    product.stock -= qty;
    product.sold_out += qty;
    await product.save({ validateBeforeSave: false });
  }
      }

      async function updateSellerInfo(amount: number) {
        const seller = await Shop.findById(req?.seller?.id);

        if (seller) {
          seller.availableBalance = amount;
          await seller.save();
        }
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

// give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order: IOrder | null = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
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

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order: IOrder | null = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successful!",
      });

      if (req.body.status === "Refund Success") {
        for (const o of order.cart) {
          await updateOrder(o._id, o.qty);
        }
      }

      async function updateOrder(id: string, qty: number) {
        const product = await Product.findById(id);

        if (product) {
          product.stock += qty;
          product.sold_out = (product.sold_out || 0) + qty;
          await product.save({ validateBeforeSave: false });
        }
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

// all orders --- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders: IOrder[] = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
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
