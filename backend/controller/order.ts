import express, { Request, Response, NextFunction } from "express";
import cloudinary, { UploadApiResponse } from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import { isAuthenticated, isSeller, isAdmin } from "../middleware/auth";
import Order from "../model/order";
import Shop, { IShop } from "../model/shop";
import Product from "../model/product";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - cart
 *         - shippingAddress
 *         - user
 *         - totalPrice
 *       properties:
 *         cart:
 *           type: array
 *           description: The items in the cart
 *           items:
 *             type: object
 *         shippingAddress:
 *           type: object
 *           description: The shipping address for the order
 *         user:
 *           type: object
 *           description: The user who placed the order
 *         totalPrice:
 *           type: number
 *           description: The total price of the order
 *         status:
 *           type: string
 *           description: The status of the order
 *           default: Processing
 *         paymentInfo:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Payment ID
 *             status:
 *               type: string
 *               description: Payment status
 *             type:
 *               type: string
 *               description: Payment type
 *         paidAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the order was paid
 *           default: The current date and time
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the order was delivered
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the order was created
 *           default: The current date and time
 */


/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management
 *   - name: Admin
 *     description: Admin operations
 */

/**
 * @swagger
 * /order/create-order:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cart:
 *                 type: array
 *               shippingAddress:
 *                 type: object
 *               user:
 *                 type: object
 *               totalPrice:
 *                 type: number
 *               paymentInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 */

/**
 * @swagger
 * /order/get-all-orders/{userId}:
 *   get:
 *     summary: Get all orders of a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */

/**
 * @swagger
 * /order/get-seller-all-orders/{shopId}:
 *   get:
 *     summary: Get all orders of a seller
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */

/**
 * @swagger
 * /order/update-order-status/{id}:
 *   put:
 *     summary: Update order status for seller
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */

/**
 * @swagger
 * /order/order-refund/{id}:
 *   put:
 *     summary: Request a refund for an order (user)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund request successful
 */

/**
 * @swagger
 * /order/order-refund-success/{id}:
 *   put:
 *     summary: Accept the refund request (seller)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund successful
 */

/**
 * @swagger
 * /order/admin-all-orders:
 *   get:
 *     summary: Get all orders (admin)
 *     tags: [Admin]
 *     responses:
 *       201:
 *         description: Orders retrieved successfully
 */

/**
 * @swagger
 * components:
 *   responses:
 *     BadRequest:
 *       description: Missing required fields
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
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
 * /order/create-order:
 *   post:
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/get-all-orders/{userId}:
 *   get:
 *     responses:
 *       200:
 *         description: All orders of user retrieved successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/get-seller-all-orders/{shopId}:
 *   get:
 *     responses:
 *       200:
 *         description: All orders of seller retrieved successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/update-order-status/{id}:
 *   put:
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/order-refund/{id}:
 *   put:
 *     responses:
 *       200:
 *         description: Order refund request successfully
 *       400:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/order-refund-success/{id}:
 *   put:
 *     responses:
 *       200:
 *         description: Order refund successful
 *       400:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order/admin-all-orders:
 *   get:
 *     responses:
 *       201:
 *         description: All orders retrieved successfully for admin
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


interface RequestWithSeller extends Request {
  seller?: IShop; // Replace 'IShop' with the actual type of the seller property
}

// create new order
router.post(
  "/create-order",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;
      if (!cart || !shippingAddress || !user || !totalPrice || !paymentInfo) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      //   group cart items by shopId
      const shopItemsMap = new Map();

      for (const item of cart) {// Log individual item
  const shopId = item.shopId;
  const itemsForShop = shopItemsMap.get(shopId) || [];
  itemsForShop.push(item);
  shopItemsMap.set(shopId, itemsForShop);
      }


      // create an order for each shop
      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
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
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
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
      const orders  = await Order.find({
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
      const order = await Order.findById(req.params.id);

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
      const order = await Order.findById(req.params.id);

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
      const order = await Order.findById(req.params.id);

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
      const orders = await Order.find().sort({
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
