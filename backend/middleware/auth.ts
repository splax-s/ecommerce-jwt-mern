import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import catchAsyncErrors from './catchAsyncErrors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../model/user';
import Shop from '../model/shop';

export interface RequestUser extends Request {
  user?: any,
  seller?: any,
}

export const isAuthenticated = catchAsyncErrors(async (req: RequestUser, res: Response, next: NextFunction) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;
    req.user = await User.findById(decoded.id) as IUser;
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401));
  }
});

export const isSeller = catchAsyncErrors(async (req: RequestUser, res: Response, next: NextFunction) => {
  const { seller_token } = req.cookies;

  if (!seller_token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }
    try {
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY as string) as JwtPayload;
     const seller = await Shop.findById(decoded.id) as IUser
   if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }
    req.seller = seller;
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401));
  }

});

export const isAdmin = (...roles: string[]) => {
  return (req: RequestUser, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`${req.user.role} can not access this resources!`, 401));
    };
    next();
  }
};
