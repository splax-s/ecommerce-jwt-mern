import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  groupTitle: string;
  members: Array<string>;
  lastMessage: string;
  lastMessageId: string;
}

const ConversationSchema: Schema = new Schema({
  groupTitle: {
    type: String,
  },
  members: {
    type: Array,
  },
  lastMessage: {
    type: String,
  },
  lastMessageId: {
    type: String,
  },
},
{ timestamps: true });

const ConversationModel = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default ConversationModel;
