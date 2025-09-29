import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  stats: {
    questionsCompleted: { type: Number, default: 0 },
    avgDifficulty: { type: Number, default: 0 },
    avgTime: { type: Number, default: 0 }
  }
});
const User = mongoose.model('User', userSchema);
export default User;
