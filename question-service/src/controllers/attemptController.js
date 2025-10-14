import Attempt from '../models/Attempt.js';
import Question from '../models/Question.js';

const attemptController = {
  recordAttempt: async (req, res) => {
    try {
      const { userId, questionId, timeTakenSeconds, difficulty } = req.body;

      // Check if question exists
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Create a new attempt record
      const newAttempt = await Attempt.create({
        userId,
        questionId,
        timeTakenSeconds,
        difficulty,
      });

      // Increment the noOfAttempts in Question
      await Question.findByIdAndUpdate(questionId, {
        $inc: { noOfAttempts: 1 },
      });

      // Update user stats
      try {
        const response = await fetch(
          `http://localhost:3001/users/${userId}/update-stats`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty, timeTakenSeconds }),
          }
        );
        const data = await response.json();
        console.log('User service response:', data);
      } catch (notifyErr) {
        console.error('Failed to notify user-service:', notifyErr.message);
      }
      res.status(201).json({
        message: 'Attempt recorded successfully',
        attempt: newAttempt,
      });
    } catch (err) {
      console.error('Error recording attempt:', err);
      res.status(500).json({
        error: 'Failed to record attempt',
        message: 'An error occurred while saving the attempt',
      });
    }
  },

  getAttempts: async (req, res) => {
    try {
      const { userId } = req.params;

      const query = {};
      if (userId) {
        query.userId = userId;
      }

      const attempts = await Attempt.find(query).sort({ createdAt: -1 });
      const updatedAttempts = await Promise.all(
        attempts.map(async (attempt) => {
          const question = await Question.findById(attempt.questionId);
          return {
            id: attempt._id,
            title: question.title,
            topics: question.topics,
            difficulty: attempt.difficulty,
            timeTakenSeconds: attempt.timeTakenSeconds,
            createdAt: attempt.createdAt,
          };
        })
      );

      res.status(200).json(updatedAttempts);
    } catch (err) {
      res.status(500).json({
        error: 'Failed to retrieve attempts',
        message: 'An error occurred while fetching the attempts',
      });
    }
  },
};

export default attemptController;
