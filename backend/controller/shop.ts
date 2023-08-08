import express, { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import cloudinary from "cloudinary";
import Shop, { IShop } from "../model/shop";
import { isAuthenticated, isSeller, isAdmin } from "../middleware/auth";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import sendShopToken from "../utils/shopToken";
import sendMail from "../utils/sendMail";

const router = express.Router();

interface RequestWithSeller extends Request {
  seller?: IShop; // Replace 'IShop' with the actual type of the seller property
}
/**
 * @swagger
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         avatar:
 *           type: object
 *           properties:
 *             public_id:
 *               type: string
 *             url:
 *               type: string
 *         address:
 *           type: string
 *         phoneNumber:
 *           type: number
 *         zipCode:
 *           type: number
 *       required:
 *         - name
 *         - email
 *         - password
 *         - avatar
 *         - address
 *         - phoneNumber
 *         - zipCode
 */


// create shop
/**
 * @swagger
 * tags:
 *   name: Shop
 *   description: Shop management
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         avatar:
 *           type: object
 *           properties:
 *             public_id:
 *               type: string
 *             url:
 *               type: string
 *         address:
 *           type: string
 *         phoneNumber:
 *           type: number
 *         zipCode:
 *           type: number
 *       required:
 *         - name
 *         - email
 *         - password
 *         - avatar
 *         - address
 *         - phoneNumber
 *         - zipCode
 */

/**
 * @swagger
 * /shop/create-shop:
 *   post:
 *     summary: Create a new shop
 *     tags: [Shop]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shop'
 *     responses:
 *       201:
 *         description: Shop created successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/activation:
 *   post:
 *     summary: Activate user
 *     tags: [Shop]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activation_token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: Invalid token or User not found
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/login-shop:
 *   post:
 *     summary: Login shop
 *     tags: [Shop]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: Invalid email or password or Missing fields
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/getSeller:
 *   get:
 *     summary: Get seller information
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: User doesn't exist
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/logout:
 *   get:
 *     summary: Log out from shop
 *     tags: [Shop]
 *     responses:
 *       201:
 *         description: Log out successful
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/get-shop-info/{id}:
 *   get:
 *     summary: Get shop information
 *     tags: [Shop]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Success
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/update-shop-avatar:
 *   put:
 *     summary: Update shop profile picture
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Seller not found
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/update-seller-info:
 *   put:
 *     summary: Update seller information
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shop'
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: User not found
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/admin-all-sellers:
 *   get:
 *     summary: Get all sellers (Admin only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/delete-seller/{id}:
 *   delete:
 *     summary: Delete seller (Admin only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Seller deleted successfully
 *       400:
 *         description: Seller not available with this id
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /shop/update-payment-methods:
 *   put:
 *     summary: Update seller withdraw methods
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: User not found
 *       500:
 *         description: An unknown error occurred
 */

router.post(
  "/create-shop",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const sellerEmail = await Shop.findOne({ email });
      if (sellerEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
      });

      const seller: IShop = new Shop({
        name: req.body.name,
        email: email,
        password: req.body.password,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        zipCode: req.body.zipCode,
      });

      await seller.save();

      const activationToken = createActivationToken(seller);

      const activationUrl = `http://localhost:8000/api/v2/seller/activation/${activationToken}`;

      try {
        // Code for sending activation email goes here
         await sendMail({
        email: seller.email,
        subject: "Activate your Shop",
        message: `Hello ${seller.name}, please click on the link to activate your shop: ${activationUrl}`,
      });
        res.status(201).json({
          success: true,
          message: `please check your email:- ${seller.email} to activate your shop!`,
        });
      } catch (error) {
       if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
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

// create activation token
const createActivationToken = (seller: IShop) => {

        return jwt.sign({ id: seller._id }, process.env.ACTIVATION_SECRET as Secret, {
            expiresIn: "5m",
        });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token } = req.body;

      const decodedToken: any = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as Secret
      );

      if (!decodedToken) {
        return next(new ErrorHandler("Invalid token", 400));
      }

      const seller = await Shop.findById(decodedToken.id);

      if (!seller) {
        return next(new ErrorHandler("User not found", 400));
      }

      sendShopToken(seller, 201, res);
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide all fields!", 400));
      }

      const seller = await Shop.findOne({ email }).select("+password");

      if (!seller) {
        return next(new ErrorHandler("User doesn't exist!", 400));
      }

      const isPasswordValid = await seller.comparePassword(password);

      if (!isPasswordValid) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      sendShopToken(seller, 201, res);
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// load shop
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const seller = await Shop.findById(req.seller?._id);

      if (!seller) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      res.status(200).json({
        success: true,
        seller,
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

// rest of the routes...

// log out from shop
router.get(
  "/logout",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
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

// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
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

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
        let existsSeller = await Shop.findById(req.seller?._id);

        if (!existsSeller) {
  // Handle the case where the seller is not found, e.g., return an error or take appropriate action.
  return next(new ErrorHandler("Seller not found", 404));
}

      const imageId = existsSeller?.avatar?.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      existsSeller.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      await existsSeller.save();

      res.status(200).json({
        success: true,
        seller: existsSeller,
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

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;

      const shop = await Shop.findById(req.seller?._id);

      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
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

// all sellers --- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
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

// delete seller ---admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
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

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const { withdrawMethod } = req.body;

      const seller = await Shop.findByIdAndUpdate(req.seller?._id, {
        withdrawMethod,
      });

      res.status(201).json({
        success: true,
        seller,
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

// delete seller withdraw methods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const seller = await Shop.findById(req.seller?._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = undefined;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
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

