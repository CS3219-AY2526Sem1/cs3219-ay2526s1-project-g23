import Attempt from '../models/Attempt.js';
import Question from '../models/Question.js';

const attemptController = {
  recordAttempt: async (req, res) => {
    try {
      const { userId, partnerId, questionId, timeTakenSeconds, difficulty, solution } = req.body;

      // Check for empty required fields
      if (!userId || !partnerId || !questionId) {
        return res.status(400).json({ error: 'Missing required fields (userId, partnerId, questionId)' });
      }

      // Check if question exists
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Prevent the User Id and the Partner Id from being the same user
      if (userId == partnerId) {
        return res.status(400).json({ error: 'User and partner cannot be the same' });
      }

      // Create a new attempt record
      const newAttempt = await Attempt.create({
        userId,
        partnerId,
        questionId,
        timeTakenSeconds,
        difficulty,
        solution
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

      const populatedAttempts = await Attempt.find(query)
        .sort({ createdAt: -1 })
        .populate("questionId", "title topics");

      const result = populatedAttempts.map(attempt => ({
        id: attempt._id,
        title: attempt.questionId.title,
        topics: attempt.questionId.topics,
        difficulty: attempt.difficulty,
        timeTakenSeconds: attempt.timeTakenSeconds,
        createdAt: attempt.createdAt,
      }));

      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        error: 'Failed to retrieve attempts',
        message: 'An error occurred while fetching the attempts',
      });
    }
  },
};

export default attemptController;
