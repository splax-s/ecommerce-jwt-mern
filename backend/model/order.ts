import mongoose, { Document } from "mongoose";

interface ICartItem {
  // Define properties of a cart item
  // You may update this based on the actual structure of your cart item
  // For example, you can have productId, quantity, price, etc.
  // For demonstration purposes, I'm using only a basic example with just a name and quantity.
  name: string;
    quantity: number;
    _id: string;
    qty: number;
}

interface IShippingAddress {
  // Define properties of the shipping address
  // You can add other relevant properties such as city, state, country, etc.
  address: string;
  postalCode: string;
}

interface IUser {
  // Define properties of the user
  // You can add other relevant properties such as username, email, etc.
  name: string;
  email: string;
}

interface IPaymentInfo {
  // Define properties of the payment info
  // You can add other relevant properties based on the payment gateway used
  id: string;
  status: string;
  type: string;
}

export interface IOrder extends Document {
  cart: ICartItem[];
  shippingAddress: IShippingAddress;
  user: IUser;
  totalPrice: number;
  status: string;
  paymentInfo: IPaymentInfo;
  paidAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  cart: {
    type: [{ name: String, quantity: Number }],
    required: true,
  },
  shippingAddress: {
    type: {
      address: String,
      postalCode: String,
    },
    required: true,
  },
  user: {
    type: {
      name: String,
      email: String,
    },
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Processing",
  },
  paymentInfo: {
    id: String,
    status: String,
    type: String,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
