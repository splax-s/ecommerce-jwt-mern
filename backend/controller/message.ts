import express, { Request, Response, NextFunction } from "express";
import cloudinary, { UploadApiResponse } from "cloudinary";
import Messages, { IMessage } from "../model/messages";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";

const router = express.Router();

// create new message
router.post(
  "/create-new-message",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageData: IMessage = req.body;

      if (req.body.images) {
        const myCloud: UploadApiResponse = await cloudinary.v2.uploader.upload(req.body.images, {
          folder: "messages",
        });
        messageData.images = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }

      const message: IMessage = new Messages({
        conversationId: messageData.conversationId,
        text: messageData.text,
        sender: messageData.sender,
        images: messageData.images || undefined,
      });

      const savedMessage = await message.save();

      res.status(201).json({
        success: true,
        message: savedMessage,
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

// get all messages with conversation id
router.get(
  "/get-all-messages/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages: IMessage[] = await Messages.find({
        conversationId: req.params.id,
      });

      res.status(200).json({
        success: true,
        messages,
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
