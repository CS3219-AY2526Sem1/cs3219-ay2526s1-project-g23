import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    timeTakenSeconds: { type: Number, required: true },
    difficulty: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Attempt", attemptSchema);
