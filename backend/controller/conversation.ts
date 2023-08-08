import { Request, Response, NextFunction } from 'express';
import Conversation from '../model/conversation';
import ErrorHandler from '../utils/ErrorHandler';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { isSeller, isAuthenticated } from '../middleware/auth';
import express from 'express';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     IConversation:
 *       type: object
 *       properties:
 *         groupTitle:
 *           type: string
 *         members:
 *           type: array
 *           items:
 *             type: string
 *         lastMessage:
 *           type: string
 *         lastMessageId:
 *           type: string
 *       example:
 *         groupTitle: Family Chat
 *         members: ["user1", "user2", "user3"]
 *         lastMessage: Hello everyone!
 *         lastMessageId: abc123
 */


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

/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: API endpoints for managing conversations
 */

/**
 * @swagger
 * /conversation/create-new-conversation:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupTitle:
 *                 type: string
 *               userId:
 *                 type: string
 *               sellerId:
 *                 type: string
 *             required:
 *               - groupTitle
 *               - userId
 *               - sellerId
 *     responses:
 *       201:
 *         description: New conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 conversation:
 *                   $ref: '#/components/schemas/IConversation'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /conversation/get-all-conversation-seller/{id}:
 *   get:
 *     summary: Get seller conversations
 *     tags: [Conversations]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Seller ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successfully fetched seller conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IConversation'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /conversation/get-all-conversation-user/{id}:
 *   get:
 *     summary: Get user conversations
 *     tags: [Conversations]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: User ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successfully fetched user conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IConversation'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /conversation/update-last-message/{id}:
 *   put:
 *     summary: Update the last message of a conversation
 *     tags: [Conversations]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Conversation ID
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
 *               lastMessage:
 *                 type: string
 *               lastMessageId:
 *                 type: string
 *             required:
 *               - lastMessage
 *               - lastMessageId
 *     responses:
 *       201:
 *         description: Last message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: true
 *                 conversation:
 *                   $ref: '#/components/schemas/IConversation'
 *       500:
 *         description: Internal server error
 */


export default router;
