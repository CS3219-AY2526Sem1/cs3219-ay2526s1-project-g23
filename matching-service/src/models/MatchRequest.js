import mongoose from 'mongoose';

const matchRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  criteria: {
    topic: { 
      type: String, 
      required: true,
      enum: [
        'binary-search', 'linked-list', 'stack', 'graph', 
        'sorting', 'tree', 'dynamic-programming', 'greedy',
        'arrays', 'strings', 'hash-table', 'two-pointers'
      ]
    },
    difficulty: { 
      type: String, 
      required: true,
      enum: ['easy', 'medium', 'hard']
    },
    proficiency: { 
      type: String, 
      required: true,
      enum: ['beginner', 'intermediate', 'pro']
    },
    language: {
      type: String,
      default: 'python',
      enum: ['python']
    }
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'matched', 'expired', 'cancelled']
  },
  queuePosition: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date,
    default: () => new Date(Date.now() + 30 * 1000) 
  },
  matchedWith: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MatchSession',
    default: null
  }
});

// Index for efficient querying
matchRequestSchema.index({ userId: 1 });
matchRequestSchema.index({ 'criteria.topic': 1, 'criteria.difficulty': 1, 'criteria.proficiency': 1 });
matchRequestSchema.index({ status: 1, createdAt: 1 });

matchRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('MatchRequest', matchRequestSchema);