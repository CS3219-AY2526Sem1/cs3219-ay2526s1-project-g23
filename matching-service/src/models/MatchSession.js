import mongoose from 'mongoose';

const matchSessionSchema = new mongoose.Schema({
  participants: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    username: String,
    originalCriteria: {
      topic: String,
      difficulty: String,
      proficiency: String,
      language: String
    }
  }],
  
  // Final matching criteria 
  sessionCriteria: {
    topic: { 
      type: String, 
      required: true 
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
      default: 'python'
    }
  },
  
  status: { 
    type: String, 
    default: 'created',
    enum: ['created', 'active', 'completed', 'abandoned', 'expired']
  },
  
  // Question assigned for this session
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'question-service',
    default: null
  },
  
  // Collaboration room details
  collaborationRoom: {
    roomId: String,
    roomUrl: String,
    createdAt: Date
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  startedAt: { 
    type: Date,
    default: null
  },
  endedAt: { 
    type: Date,
    default: null
  },
  duration: { 
    type: Number,
    default: 0
  },
  
  // Session expiration
  expiresAt: { 
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from creation
  },
  
  // Metadata
  matchingAlgorithm: {
    type: String,
    default: 'exact-topic-proximity-proficiency'
  },
  matchScore: {
    type: Number,
    default: 0
  }
});

// Ensure exactly 2 participants
matchSessionSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Match session must have exactly 2 participants'));
  }
  next();
});

// Calculate duration on completion
matchSessionSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.startedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  next();
});

// Indexes for efficient querying
matchSessionSchema.index({ 'participants.userId': 1 });
matchSessionSchema.index({ status: 1, createdAt: -1 });
matchSessionSchema.index({ 'sessionCriteria.topic': 1, 'sessionCriteria.difficulty': 1 });

// TTL index - automatically remove expired sessions
matchSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('MatchSession', matchSessionSchema);