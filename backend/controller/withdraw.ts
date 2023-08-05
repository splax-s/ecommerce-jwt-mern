import express, { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import Shop, { IShop } from '../model/shop';
import ErrorHandler from '../utils/ErrorHandler';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { isSeller, isAuthenticated, isAdmin } from '../middleware/auth';
import Withdraw, { IWithdraw } from '../model/withdraw';
import sendMail from '../utils/sendMail';

const router = express.Router();

interface RequestWithSeller extends Request {
  seller?: IShop; // Replace 'IShop' with the actual type of the seller property
}


// create withdraw request --- only for seller
router.post(
  "/create-withdraw-request",
  isSeller,
  catchAsyncErrors(async (req: RequestWithSeller, res: Response, next: NextFunction) => {
    try {
      const { amount }: { amount: number } = req.body;

      const data = {
        seller: req.seller,
        amount,
      };

      try {
        if (req?.seller?.email) {
          await sendMail({
            email: req?.seller.email,
            subject: "Withdraw Request",
            message: `Hello ${req.seller.name}, Your withdraw request of ${amount}$ is processing. It will take 3days to 7days to process! `,
          });
          res.status(201).json({
            success: true,
          });
        } else {
          throw new Error('Seller email is missing.');
        }
      } catch (error) {
           if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
      }

      const withdraw: IWithdraw = await Withdraw.create(data);

      const shop: IShop | null = await Shop.findById(req.seller._id);

      if (shop) {
        shop.availableBalance = shop.availableBalance - amount;
        await shop.save();
      }

      res.status(201).json({
        success: true,
        withdraw,
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
// get all withdraws --- admin
router.get(
  "/get-all-withdraw-request",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdraws: IWithdraw[] = await Withdraw.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        withdraws,
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

// update withdraw request ---- admin
router.put(
  "/update-withdraw-request/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sellerId }: { sellerId: string } = req.body;

      const withdraw: IWithdraw | null = await Withdraw.findByIdAndUpdate(
        req.params.id,
        {
          status: "succeed",
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!withdraw) {
        return next(new ErrorHandler("Withdraw not found.", 404));
      }

      const seller: IShop | null = await Shop.findById(sellerId);

      if (!seller) {
        return next(new ErrorHandler("Seller not found.", 404));
      }

      // ... (rest of the code)

      res.status(201).json({
        success: true,
        withdraw,
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
