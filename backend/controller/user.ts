import express, { Router, Request, Response, NextFunction } from "express";
import User, {IUser} from "../model/user";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import sendToken from "../utils/jwtToken";
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router: Router = express.Router();

//Define user type
// interface IUser {
//   name: string;
//   email: string;
//   password: string;
//   avatar: {
//     public_id: string;
//     url: string;
//   };
//     comparePassword?: (password: string) => Promise<boolean>;
// }

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The password for the user
 *         phoneNumber:
 *           type: number
 *           description: The phone number of the user
 *         addresses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               zipCode:
 *                 type: number
 *               addressType:
 *                 type: string
 *           description: The addresses of the user
 *         role:
 *           type: string
 *           description: The role of the user (default is "user")
 *         avatar:
 *           type: object
 *           properties:
 *             public_id:
 *               type: string
 *               description: The public ID of the avatar
 *             url:
 *               type: string
 *               description: The URL of the avatar
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation date of the user
 *         resetPasswordToken:
 *           type: string
 *           description: The reset password token for the user
 *         resetPasswordTime:
 *           type: string
 *           format: date-time
 *           description: The reset password time for the user
 *       required:
 *         - name
 *         - email
 *         - password
 *         - avatar
 */


interface IRequestWithUser extends Request {
  user: {
    id?: string;
    // other properties you expect on user
  };
}

/**
 * @openapi
 * /user/create-user:
 *   post:
 *     summary: Create a new user account
 *     description: This endpoint allows for the creation of a new user account.
 *     tags:
 *       - Users
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - avatar
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: object
 *                 properties:
 *                   public_id:
 *                     type: string
 *                   url:
 *                     type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists or other client error
 *       500:
 *         description: Server error
 */
router.post("/create-user", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, avatar } = req.body as IUser;
    const userEmail = await User.findOne({ email });


    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
      });


    const user: IUser = new User({
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    await user.save();

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:8000/api/v2/user/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
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
});

// create activation token
const createActivationToken = (user: IUser): string => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET!, {
    expiresIn: "5m",
  });
};

/**
 * @swagger
 * /user/activation:
 *   post:
 *     summary: Activate a user account
 *     description: This endpoint allows for the activation of a user account using an activation token.
 *     tags:
 *       - Users
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activation_token
 *             properties:
 *               activation_token:
 *                 type: string
 *     responses:
 *       201:
 *         description: User activated successfully
 *       400:
 *         description: Invalid token or user already exists
 *       500:
 *         description: Server error
 */
router.post(
  "/activation",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token } = req.body;

      const newUser: IUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET!
      ) as IUser;

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
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
 * /user/login-user:
 *   post:
 *     summary: Log in a user
 *     description: This endpoint allows for the login of a user using email and password.
 *     tags:
 *       - Users
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User logged in successfully
 *       400:
 *         description: Please provide all fields or user doesn't exist or incorrect information
 *       500:
 *         description: Server error
 */
router.post(
  "/login-user",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exist!", 400));
      }

        if (user.comparePassword) {
  const isPasswordValid = await user.comparePassword(password);
            // rest of the code
             if (!isPasswordValid) {
        return next(new ErrorHandler("Please provide the correct information", 400));
      }
} else {
  // handle the error
}



      sendToken(user, 201, res);
    } catch (error) {
     if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// load user
/**
 * @swagger
 * /user/getuser:
 *   get:
 *     summary: Get user information
 *     description: This endpoint retrieves the information of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       400:
 *         description: User doesn't exist
 *       500:
 *         description: Server error
 */
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      res.status(200).json({
        success: true,
        user,
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

// log out user
/**
 * @swagger
 * /user/logout:
 *   get:
 *     summary: Log out a user
 *     description: This endpoint logs out the authenticated user.
 *     tags:
 *       - Users
 *     responses:
 *       201:
 *         description: Log out successful
 *       500:
 *         description: Server error
 */
router.get(
  "/logout",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("token", null, {
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
        if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
      }
    }
  })
);

// update user info
/**
 * @swagger
 * /user/update-user-info:
 *   put:
 *     summary: Update user information
 *     description: This endpoint updates the information of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User information updated successfully
 *       400:
 *         description: User not found or incorrect information
 *       500:
 *         description: Server error
 */
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      if (user.comparePassword) {
  const isPasswordValid = await user.comparePassword(password);
            // rest of the code
             if (!isPasswordValid) {
        return next(new ErrorHandler("Please provide the correct information", 400));
      }
} else {
  // handle the error
}

    //   if (!isPasswordValid) {
    //     return next(new ErrorHandler("Please provide the correct information", 400));
    //   }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
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
 * /user/update-avatar:
 *   put:
 *     summary: Update user avatar
 *     description: This endpoint updates the avatar of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
    try {
      let existsUser = await User.findById(req.user.id);
      if (!existsUser) {
        return next(new ErrorHandler("User not found", 400));
      }

      if (req.body.avatar !== "") {
        const imageId = existsUser.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
        });

        existsUser.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
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

// update user addresses
/**
 * @swagger
 * /user/update-user-addresses:
 *   put:
 *     summary: Update user addresses
 *     description: This endpoint updates the addresses of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressType:
 *                 type: string
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Addresses updated successfully
 *       400:
 *         description: User doesn't exist or address already exists
 *       500:
 *         description: Server error
 */
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(new ErrorHandler(`${req.body.addressType} address already exists`, 400));
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
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

// delete user address
/**
 * @swagger
 * /user/delete-user-address/{id}:
 *   delete:
 *     summary: Delete user address
 *     description: This endpoint deletes a specific address of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the address to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       400:
 *         description: User doesn't exist
 *       500:
 *         description: Server error
 */
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 500));
      } else {
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  })
);

// update user password
/**
 * @swagger
 * /user/update-user-password:
 *   put:
 *     summary: Update user password
 *     description: This endpoint updates the password of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Old password is incorrect or passwords don't match
 *       500:
 *         description: Server error
 */
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }


        if (user.comparePassword) {
            const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
            // rest of the code
             if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }
} else {
  // handle the error
}

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesn't match with each other!", 400));
      }

      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
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

// find user information with the userId
/**
 * @swagger
 * /user/user-info/{id}:
 *   get:
 *     summary: Retrieve user information
 *     description: This endpoint retrieves information about a specific user by ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: User information retrieved successfully
 *       400:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      res.status(201).json({
        success: true,
        user,
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

// all users --- for admin
/**
 * @swagger
 * /user/admin-all-users:
 *   get:
 *     summary: Retrieve all users (Admin only)
 *     description: This endpoint retrieves all users. Accessible only by admins.
 *     tags:
 *       - Admin
 *     security:
 *       - Bearer: []
 *     responses:
 *       201:
 *         description: Users retrieved successfully
 *       500:
 *         description: Server error
 */

router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
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
 * /user/delete-user/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: This endpoint deletes a specific user by ID. Accessible only by admins.
 *     tags:
 *       - Admin
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: User deleted successfully
 *       400:
 *         description: User is not available with this ID
 *       500:
 *         description: Server error
 */

router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      const imageId = user.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
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
