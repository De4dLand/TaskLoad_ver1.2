import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: false });

const chatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'project', 'task'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  messages: [messageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });

// Create a compound index for finding direct chats between two users
chatSchema.index({ type: 1, participants: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;