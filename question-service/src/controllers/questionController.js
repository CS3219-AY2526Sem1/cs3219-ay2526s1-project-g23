import Question from '../models/Question.js';

const questionController = {
    getQuestion: async (req, res) => {
        try {
            const { type, difficulty, page = 1, limit = 10, search } = req.query;
            const query = {}

            if (type) query.topic = type;              // Assuming your schema uses "topic"
            if (difficulty) query.difficulty = difficulty;
            if (search) {
                query.$or = [
                    { title: new RegExp(search, 'i') },
                    { content: new RegExp(search, 'i') },
                ];
            }

            const questions = await Question.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 });

            const total = await Question.countDocuments(query);

            res.status(200).json({
                questions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (err) {
            console.error('Get questions error:', err);
            res.status(500).json({
                error: 'Failed to retrieve questions',
                message: 'Unable to fetch questions list'
            });
        }
    },

    getQuestionById: async (req, res) => {
        try {
            console.log("Get question by id called");
            const { id } = req.params;

            const question = await Question.findById(id);

            if (!question) {
                return res.status(404).json({ error: "Question not found" });
            }

            res.status(200).json(question);

        } catch (err) {
            console.error("Error fetching question by ID:", err);
            res.status(500).json({
                error: "Failed to retrieve question",
                message: "An error occurred while fetching the question",
            });
        }
    },

    getPopularQuestions: async (req, res) => {
        try {
            console.log("Get popular question called");
            //Default number of questions shown is 10
            const { limit = 10 } = req.query;

            // Find questions sorted by attemptCount descending
            const questions = await Question.find()
                .sort({ attemptCount: -1 })
                .limit(parseInt(limit));

            res.status(200).json(questions);

        } catch (err) {
            console.error("Error fetching popular questions:", err);
            res.status(500).json({
                error: "Failed to retrieve popular questions",
                message: "Unable to fetch popular questions list"
            });
        }
    },
}

export default questionController;