import Question from '../models/Question.js';

const questionController = {
    getQuestion: async (req, res) => {
        try {
            const { type, difficulty, page = 1, limit = 10, search } = req.query;
            const query = {}

            if (type) {
                const searchType = type.replace(/-/g, ' ');
                query.topics = { 
                    $in: [new RegExp(`^${searchType}$`, 'i')] // Case insensitive match
                };  
            }
            if (difficulty) {
                    query.difficulty = new RegExp(`^${difficulty}$`, 'i'); // Case-insensitive match
            }

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

            // Find questions sorted by noOfAttempts descending
            const questions = await Question.find()
                .sort({ noOfAttempts: -1 })
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

    createQuestion: async (req, res) => {
        try {
            const {
                title,
                content,
                difficulty,
                noOfAttempts = 0,
                topics,
                hints = [],
                aveTimeSeconds = 0,
                isActive = true
            } = req.body;
            // Validate required fields
            if (!title || !content || !difficulty || !topics) {
                return res.status(400).json({ error: "Missing required fields",
                    message: "Title, content, difficulty, and topics are required."
                });
            }

            // Validate diffulty level
            const validDifficulties = ["Easy", "Medium", "Hard"];
            if (!validDifficulties.includes(difficulty)) {
                return res.status(400).json({ error: "Invalid difficulty level",
                    message: `Difficulty must be one of: ${validDifficulties.join(", ")}.`
                });
            }

            const newQuestion = new Question({
                title,
                content,
                difficulty: difficulty,
                topics: Array.isArray(topics) ? topics : [topics],
                hints: Array.isArray(hints) ? hints : [hints],
                noOfAttempts,
                aveTimeSeconds,
                isActive
            });

            const savedQuestion = await newQuestion.save();

            res.status(201).json({
                message: 'Question created successfully',
                question: savedQuestion
            });

        } catch (err) {
            console.error('Create question error:', err);
            
            if (err.name === 'ValidationError') {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: err.message
                });
            }

            res.status(500).json({
                error: 'Failed to create question',
                message: 'Unable to create question'
            });
        }
    },

    // Modify existing question
    updateQuestion: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove fields that should not be updated
            delete updates.createdAt;
            delete updates._id;
            delete updates.updatedAt;

            // Validate diffulty level if it's being updated
            if (updates.difficulty) {
                const validDifficulties = ["Easy", "Medium", "Hard"];
                if (!validDifficulties.includes(updates.difficulty)) {
                    return res.status(400).json({ error: "Invalid difficulty level",
                        message: `Difficulty must be one of: ${validDifficulties.join(", ")}.`
                    });
                }
                updates.difficulty = updates.difficulty;
            }

            // Convert single values to arrays for topics and hints
            if (updates.topics && !Array.isArray(updates.topics)) {
                updates.topics = [updates.topics];
            }
            if (updates.hints && !Array.isArray(updates.hints)) {
                updates.hints = [updates.hints];
            }
            
            const updatedQuestion = await Question.findByIdAndUpdate(
                id,
                { ...updates, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!updatedQuestion) {
                return res.status(404).json({
                    error: "Question not found",
                    message: `No question found with ID: ${id}`
                });
            }

            res.status(200).json({
                message: 'Question updated successfully',
                question: updatedQuestion
            });
        } catch (err) {
            console.error('Update question error:', err);
            if (err.name === 'ValidationError') {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: err.message
                });
            }

            res.status(500).json({
                error: 'Failed to update question',
                message: 'Unable to update question'
            });
        }
    },
    
    // Activate - Setting isActive to true
    activateQuestion: async (req, res) => {
        try {
            const { id } = req.params;

            const activatedQuestion = await Question.findByIdAndUpdate(
                id,
                { 
                    isActive: true, 
                    updatedAt: new Date() 
                },
                { new: true }
            );

            if (!activatedQuestion) {
                return res.status(404).json({
                    error: 'Question not found',
                    message: 'The question you are trying to activate does not exist'
                });
            }

            res.status(200).json({
                message: 'Question activated successfully',
                question: activatedQuestion
            });

        } catch (err) {
            console.error('Activate question error:', err);
            
            if (err.name === 'CastError') {
                return res.status(400).json({
                    error: 'Invalid ID',
                    message: 'The provided question ID is invalid'
                });
            }

            res.status(500).json({
                error: 'Failed to activate question',
                message: 'Unable to activate question'
            });
        }
    },

    // Deactivate - Setting isActive to false
    deactivateQuestion: async (req, res) => {
        try {
            const { id } = req.params;

            // Soft delete by setting isActive to false
            const deletedQuestion = await Question.findByIdAndUpdate(
                id,
                { isActive: false, updatedAt: new Date() },
                { new: true }
            );

            if (!deletedQuestion) {
                return res.status(404).json({
                    error: 'Question not found',
                    message: 'The question you are trying to deactivate does not exist'
                });
            }

            res.status(200).json({
                message: 'Question deactivate successfully',
                question: deletedQuestion
            });

        } catch (err) {
            console.error('Deactivate question error:', err);
            res.status(500).json({
                error: 'Failed to deactivate question',
                message: 'Unable to deactivate question'
            });
        }
    },

    // HARD DELETE question (completely remove from database)
    deleteQuestion: async (req, res) => {
        try {
            const { id } = req.params;

            // Find the question first to return it in response
            const question = await Question.findById(id);
            
            if (!question) {
                return res.status(404).json({
                    error: 'Question not found',
                    message: 'The question you are trying to delete does not exist'
                });
            }

            // Permanently delete from database
            await Question.findByIdAndDelete(id);

            res.status(200).json({
                message: 'Question permanently deleted',
                deletedQuestion: question // Return the deleted question for reference
            });

        } catch (err) {
            console.error('Hard delete question error:', err);
            
            if (err.name === 'CastError') {
                return res.status(400).json({
                    error: 'Invalid ID',
                    message: 'The provided question ID is invalid'
                });
            }

            res.status(500).json({
                error: 'Failed to delete question',
                message: 'Unable to delete question'
            });
        }
    },
}
export default questionController;