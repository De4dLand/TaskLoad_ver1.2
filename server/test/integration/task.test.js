import { setupTestDB, clearTestDB, closeTestDB, createTestUser, request } from '../testHelpers.js';
import Task from '../../../src/models/Task.js';
import Project from '../../../src/models/Project.js';

describe('Task API', () => {
  let authToken;
  let testUser;
  let testProject;
  let testTask;

  // Setup test database before all tests
  beforeAll(async () => {
    await setupTestDB();
    
    // Create a test user and get auth token
    const { user, token } = await createTestUser();
    testUser = user;
    authToken = token;

    // Create a test project
    testProject = new Project({
      name: 'Test Project',
      description: 'Test Project Description',
      owner: testUser._id,
      members: [{
        user: testUser._id,
        role: 'owner'
      }]
    });
    await testProject.save();
  });

  // Clear all test data after each test
  afterEach(async () => {
    await clearTestDB();
  });

  // Close the database after all tests
  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        project: testProject._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimatedHours: 5
      };

      const response = await request
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.status).toBe(taskData.status);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.project).toBe(testProject._id.toString());
      expect(new Date(response.body.dueDate).getTime()).toBe(new Date(taskData.dueDate).getTime());
      expect(response.body.estimatedHours).toBe(taskData.estimatedHours);
      expect(response.body.createdBy).toBe(testUser._id.toString());
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Missing title' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Validation Error');
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      const tasks = [
        {
          title: 'Task 1',
          description: 'Description 1',
          status: 'todo',
          priority: 'high',
          project: testProject._id,
          createdBy: testUser._id,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        },
        {
          title: 'Task 2',
          description: 'Description 2',
          status: 'in_progress',
          priority: 'medium',
          project: testProject._id,
          createdBy: testUser._id,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
        },
        {
          title: 'Task 3',
          description: 'Description 3',
          status: 'completed',
          priority: 'low',
          project: testProject._id,
          createdBy: testUser._id,
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should get all tasks for the authenticated user', async () => {
      const response = await request
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(3);
      expect(response.body.pagination).toEqual({
        total: 3,
        page: 1,
        limit: 10,
        pages: 1
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request
        .get('/api/v1/tasks?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe('completed');
    });

    it('should sort tasks by due date', async () => {
      const response = await request
        .get('/api/v1/tasks?sort=dueDate&order=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tasks = response.body.tasks;
      expect(tasks).toHaveLength(3);
      
      // Check if tasks are sorted by due date in ascending order
      const dueDates = tasks.map(task => new Date(task.dueDate).getTime());
      const sortedDueDates = [...dueDates].sort((a, b) => a - b);
      expect(dueDates).toEqual(sortedDueDates);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = new Task({
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        project: testProject._id,
        createdBy: testUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await task.save();
    });

    it('should get a task by ID', async () => {
      const response = await request
        .get(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(task._id.toString());
      expect(response.body.title).toBe(task.title);
      expect(response.body.description).toBe(task.description);
    });

    it('should return 404 if task is not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request
        .get(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.message).toBe('Task not found');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = new Task({
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        project: testProject._id,
        createdBy: testUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await task.save();
    });

    it('should update a task', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'in_progress',
        priority: 'high'
      };

      const response = await request
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.status).toBe(updates.status);
      expect(response.body.priority).toBe(updates.priority);
    });

    it('should return 403 if user is not authorized to update the task', async () => {
      // Create a different user
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Other@1234'
      });
      await otherUser.save();

      const updates = { title: 'Unauthorized Update' };

      const response = await request
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(otherUser._id)}`)
        .send(updates)
        .expect(403);

      expect(response.body.error.message).toContain("don't have permission");
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = new Task({
        title: 'Task to Delete',
        description: 'Will be deleted',
        status: 'todo',
        priority: 'low',
        project: testProject._id,
        createdBy: testUser._id
      });
      await task.save();
    });

    it('should delete a task', async () => {
      await request
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 403 if user is not authorized to delete the task', async () => {
      // Create a different user
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Other@1234'
      });
      await otherUser.save();

      const response = await request
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(otherUser._id)}`)
        .expect(403);

      expect(response.body.error.message).toContain("don't have permission");
    });
  });

  describe('PATCH /api/v1/tasks/:id/status', () => {
    let task;

    beforeEach(async () => {
      task = new Task({
        title: 'Task to Update Status',
        description: 'Will update status',
        status: 'todo',
        priority: 'medium',
        project: testProject._id,
        createdBy: testUser._id
      });
      await task.save();
    });

    it('should update task status', async () => {
      const response = await request
        .patch(`/api/v1/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.status).toBe('in_progress');
      
      // Verify the status was updated in the database
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.status).toBe('in_progress');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request
        .patch(`/api/v1/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid status value');
    });
  });
});
