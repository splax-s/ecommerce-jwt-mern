import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdraw extends Document {
  seller: object;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawSchema: Schema = new Schema({
  seller: {
    type: Object,
    required: true,
  },
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
  }
});

const Withdraw = mongoose.model<IWithdraw>('Withdraw', WithdrawSchema);
export default Withdraw;
