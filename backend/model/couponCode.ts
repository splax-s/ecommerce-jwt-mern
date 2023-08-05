import mongoose, { Document, Schema } from "mongoose";

export interface ICouponCode extends Document {
  name: string;
  value: number;
  minAmount: number;
  maxAmount: number;
  shopId: string;
  selectedProduct: string;
  createdAt: Date;
}

const CouponCodeSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter your coupon code name!"],
    unique: true,
  },
  value: {
    type: Number,
    required: true,
  },
  minAmount: {
    type: Number,
  },
  maxAmount: {
    type: Number,
  },
  shopId: {
    type: String,
    required: true,
  },
  selectedProduct: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CouponCodeModel = mongoose.model<ICouponCode>("CouponCode", CouponCodeSchema);

export default CouponCodeModel;
