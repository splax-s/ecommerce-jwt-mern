import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';

export interface IShop extends Document {
  name: string;
  email: string;
  password: string;
  description?: string;
  address: string;
  phoneNumber: number;
  role: string;
  avatar: {
    public_id: string;
    url: string;
  };
  zipCode: number;
  withdrawMethod?: object;
  availableBalance: number;
  transections: Array<{
    amount: number;
    status: string;
    createdAt: Date;
    updatedAt?: Date;
  }>;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordTime?: Date;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
  getJwtToken: () => string;
}

const shopSchema = new Schema<IShop>({
  name: {
    type: String,
    required: [true, "Please enter your shop name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your shop email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password should be greater than 6 characters"],
    select: false,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: "Seller",
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  withdrawMethod: {
    type: Object,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  transections: [
    {
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: "Processing",
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Hash password
shopSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
shopSchema.methods.getJwtToken = function () {
  const secretKey: Secret = process.env.JWT_SECRET_KEY || '';
  const jwtExpires: string | number | undefined = process.env.JWT_EXPIRES;

  return jwt.sign({ id: this._id }, secretKey, {
    expiresIn: jwtExpires,
  });
};

// compare password
shopSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IShop>('Shop', shopSchema);

