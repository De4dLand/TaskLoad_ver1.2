import mongoose from 'mongoose';

const timeTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0,
    comment: 'Duration in seconds'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Calculate duration when ending a session
timeTrackingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.isModified('endTime')) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    this.isActive = false;
  }
  next();
});

// Indexes for efficient queries
timeTrackingSchema.index({ startTime: -1 });
timeTrackingSchema.index({ isActive: 1 });

// Compound indexes for common queries
timeTrackingSchema.index({ userId: 1, isActive: 1 });
timeTrackingSchema.index({ projectId: 1, startTime: -1 });
timeTrackingSchema.index({ taskId: 1, startTime: -1 });

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

export default TimeTracking;