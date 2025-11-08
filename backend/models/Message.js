import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    participants: { type: [String], required: true, index: true }, // user IDs or emails used to derive conversation
    sender: { type: String, required: true }, // sender user id or email
    text: { type: String, required: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export default Message;
