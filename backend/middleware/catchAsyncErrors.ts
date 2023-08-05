import { Request, Response, NextFunction } from 'express';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    // other properties you expect on user
  };
}

type MiddlewareFunction = (req: any, res: Response, next: NextFunction) => void;

const catchAsyncErrors = (theFunc: MiddlewareFunction): MiddlewareFunction => {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      theFunc(req, res, next);
    } catch (error) {
      next(error);
    }
  }
};

export default catchAsyncErrors;
