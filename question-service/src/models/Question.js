import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: { 
        title: { type: String, required: true},
        content: { type: String, required: true}
    },
    difficulty: { type: String, required: true},
    noOfAttempts: { type: Number, required: true},
    isActive: { type: Boolean, default: true },
    aveTimeSeconds: { type: Number, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    topic: { type: String, required: true},
    hint: { type: String}
})

const Question = mongoose.model('Question', questionSchema);
export default Question;