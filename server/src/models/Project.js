import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    color: {
        type: String,
        trim: true,
        default: '#1976d2'
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
        default: 'planning'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        default: Date.now
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        default: Date.now
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Project must have an owner']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        }
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    tags: [{
        type: String,
        trim: true
    }],
    budget: {
        estimated: {
            type: Number,
            min: 0
        },
        actual: {
            type: Number,
            min: 0
        }
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    customFields: [{
        name: String,
        value: mongoose.Schema.Types.Mixed
    }],
    attachments: [{
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        allowComments: {
            type: Boolean,
            default: true
        },
        allowAttachments: {
            type: Boolean,
            default: true
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ name: 1, team: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ startDate: 1 });
projectSchema.index({ endDate: 1 });

// Virtual populate tasks
projectSchema.virtual('taskCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project',
    count: true
});

// Pre-save middleware
projectSchema.pre('save', function (next) {
    if (this.isModified('endDate') && this.endDate < this.startDate) {
        next(new Error('End date cannot be before start date'));
    }
    next();
});

// Methods
projectSchema.methods.updateProgress = async function () {
    const tasks = await mongoose.model('Task').find({ project: this._id });
    if (tasks.length === 0) {
        this.progress = 0;
        return;
    }

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    this.progress = Math.round((completedTasks / tasks.length) * 100);
    await this.save();
};

// Methods for managing custom fields and dynamic data
projectSchema.methods.addCustomField = async function(name, value) {
  if (!this.customFields) this.customFields = [];
  this.customFields.push({ name, value });
  await this.save();
  return this;
};

projectSchema.methods.updateCustomField = async function(name, value) {
  const field = this.customFields.find(f => f.name === name);
  if (field) {
    field.value = value;
    await this.save();
    return true;
  }
  return false;
};

projectSchema.methods.addAttachment = async function(attachment) {
  if (!this.attachments) this.attachments = [];
  this.attachments.push({
    ...attachment,
    uploadedAt: new Date()
  });
  await this.save();
  return this;
};

projectSchema.methods.updateSettings = async function(settings) {
  this.settings = { ...this.settings, ...settings };
  await this.save();
  return this;
};

// Instance methods for access control
projectSchema.methods.hasAccess = function(userId) {
  // Owner or any project member has access
  if (this.owner.toString() === userId.toString()) return true
  return Array.isArray(this.members) && this.members.some(m => m.user.toString() === userId.toString())
}

projectSchema.methods.hasRole = function(userId, roles) {
  // Owner always qualifies
  if (this.owner.toString() === userId.toString()) return true
  const member = Array.isArray(this.members) && this.members.find(m => m.user.toString() === userId.toString())
  return member ? roles.includes(member.role) : false
}

const Project = mongoose.model('Project', projectSchema);

export default Project;