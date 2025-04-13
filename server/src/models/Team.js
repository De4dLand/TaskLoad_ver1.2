import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team must have a leader']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ isActive: 1 });

// Virtual populate projects
teamSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'team',
  count: true
});

// Virtual populate members
teamSchema.virtual('memberCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'teams',
  count: true
});

// Methods
teamSchema.methods.addMember = async function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    await this.save();
  }
};

teamSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  await this.save();
};

teamSchema.methods.addProject = async function (projectId) {
  if (!this.projects.includes(projectId)) {
    this.projects.push(projectId);
    await this.save();
  }
};

teamSchema.methods.removeProject = async function (projectId) {
  this.projects = this.projects.filter(project => project.toString() !== projectId.toString());
  await this.save();
};

// Methods for managing custom fields
teamSchema.methods.addCustomField = async function(name, value) {
  if (!this.customFields) this.customFields = [];
  this.customFields.push({ name, value });
  await this.save();
  return this;
};

teamSchema.methods.updateCustomField = async function(name, value) {
  const field = this.customFields.find(f => f.name === name);
  if (field) {
    field.value = value;
    await this.save();
    return true;
  }
  return false;
};

teamSchema.methods.removeCustomField = async function(name) {
  const initialLength = this.customFields.length;
  this.customFields = this.customFields.filter(f => f.name !== name);
  if (this.customFields.length !== initialLength) {
    await this.save();
    return true;
  }
  return false;
};

const Team = mongoose.model('Team', teamSchema);

export default Team;

