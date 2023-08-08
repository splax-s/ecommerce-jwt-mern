import express, { Request, Response, NextFunction } from "express";
import cloudinary, { UploadApiResponse } from "cloudinary";
import Messages, { IMessage } from "../model/messages";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         public_id:
 *           type: string
 *           description: The public ID of the image
 *         url:
 *           type: string
 *           description: The URL of the image
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the message
 *           required: true
 *         conversationId:
 *           type: string
 *           description: The ID of the conversation to which the message belongs
 *         text:
 *           type: string
 *           description: The text content of the message
 *         sender:
 *           type: string
 *           description: The sender of the message
 *         images:
 *           $ref: '#/components/schemas/Image'
 *           description: The images associated with the message
 *       required:
 *         - id
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Endpoints for managing messages
 */

/**
 * @swagger
 * /message/create-new-message:
 *   post:
 *     summary: Create a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       500:
 *         description: An unknown error occurred
 */

/**
 * @swagger
 * /message/get-all-messages/{id}:
 *   get:
 *     summary: Get all messages with a specific conversation ID
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The conversation ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       500:
 *         description: An unknown error occurred
 */


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
