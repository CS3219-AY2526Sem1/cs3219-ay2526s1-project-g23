import Attempt from '../models/Attempt.js';
import Question from '../models/Question.js';

const attemptController = {
    recordAttempt: async (req, res) => {
        try {
            const { userId, questionId, timeTakenSeconds, difficulty } = req.body;

            // Check if question exists
            const question = await Question.findById(questionId);
            if (!question) {
                return res.status(404).json({ error: "Question not found" });
            }

            // Create a new attempt record
            const newAttempt = await Attempt.create({
                userId,
                questionId,
                timeTakenSeconds,
                difficulty
            });

            // Increment the noOfAttempts in Question
            await Question.findByIdAndUpdate(questionId, { $inc: { noOfAttempts: 1 } });

            // // Update user stats (Need to fix)
            // await User.findByIdAndUpdate(userId, { $inc: { "stats.questionsCompleted": 1 } });

            res.status(201).json({
                message: 'Attempt recorded successfully',
                attempt: newAttempt
            });

        } catch (err) {
            console.error('Error recording attempt:', err);
            res.status(500).json({
                error: 'Failed to record attempt',
                message: 'An error occurred while saving the attempt'
            });
        }
    }
};

export default attemptController;