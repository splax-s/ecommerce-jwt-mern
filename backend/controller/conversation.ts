import { Request, Response, NextFunction } from 'express';
import Conversation from '../model/conversation';
import ErrorHandler from '../utils/ErrorHandler';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { isSeller, isAuthenticated } from '../middleware/auth';
import express from 'express';

const router = express.Router();

// Create a new conversation
router.post(
  "/create-new-conversation",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupTitle, userId, sellerId } = req.body;

      const isConversationExist = await Conversation.findOne({ groupTitle });

      if (isConversationExist) {
        const conversation = isConversationExist;
        res.status(201).json({
          success: true,
          conversation,
        });
      } else {
        const conversation = await Conversation.create({
          members: [userId, sellerId],
          groupTitle: groupTitle,
        });

        res.status(201).json({
          success: true,
          conversation,
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

// Get seller conversations
router.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversations = await Conversation.find({
        members: {
          $in: [req.params.id],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(201).json({
        success: true,
        conversations,
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

// Get user conversations
router.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversations = await Conversation.find({
        members: {
          $in: [req.params.id],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(201).json({
        success: true,
        conversations,
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

// Update the last message
router.put(
  "/update-last-message/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lastMessage, lastMessageId } = req.body;

      const conversation = await Conversation.findByIdAndUpdate(req.params.id, {
        lastMessage,
        lastMessageId,
      });

      res.status(201).json({
        success: true,
        conversation,
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
