import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  id: string;
  conversationId: string;
  text: string;
  sender: string;
  images: {
    public_id: string;
    url: string;
  };
}

const MessagesSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    conversationId: {
      type: String,
    },
    text: {
      type: String,
    },
    sender: {
      type: String,
    },
    images: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model<IMessage>("Message", MessagesSchema);

export default MessageModel;
