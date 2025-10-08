import Attempt from '../models/Attempt.js';
import Question from '../models/Question.js';

const attemptController = {
    recordAttempt: async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrator privileges required'
                });
            }
            const { userId, questionId, timeTakenSeconds, difficulty } = req.body;

            // Create a new attempt record
            const newAttempt = await Attempt.create({
                userId,
                questionId,
                timeTakenSeconds,
                difficulty
            });

            // Increment the noOfAttempts in Question
            await Question.findByIdAndUpdate(questionId, { $inc: { noOfAttempts: 1 } });

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