import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema(
  {
    user_id: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);
export default ContactMessage;
