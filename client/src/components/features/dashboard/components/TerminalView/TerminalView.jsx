import React, { useState } from 'react';
import styles from './TerminalView.module.css';

const initialColumns = [
  { id: 'notAssigned', title: 'Not Assigned', tasks: [] },
  { id: 'inProgress', title: 'In Progress', tasks: [] },
  { id: 'reviewing', title: 'Reviewing', tasks: [] },
  { id: 'completed', title: 'Completed', tasks: [] },
];

const initialTasks = [
  {
    id: 1,
    title: 'Create project structure',
    description: 'Set up initial folder structure',
    status: 'notAssigned',
    dependencies: [],
  },
  {
    id: 2,
    title: 'Design database schema',
    description: 'Define tables and relationships',
    status: 'inProgress',
    dependencies: [],
  },
  {
    id: 3,
    title: 'Implement authentication',
    description: 'User login and registration',
    status: 'reviewing',
    dependencies: [1],
  },
];

const TerminalView = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState('task');
  const [newColumn, setNewColumn] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', dependencies: [] });

  // Handle adding new column
  const handleAddColumn = () => {
    if (!newColumn.trim()) return;
    const id = newColumn.replace(/\s+/g, '').toLowerCase();
    setColumns([...columns, { id, title: newColumn, tasks: [] }]);
    setNewColumn('');
  };

  // Handle adding new task
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    setTasks([...tasks, { ...newTask, id, status: 'notAssigned' }]);
    setNewTask({ title: '', description: '', dependencies: [] });
  };

  // Handle dependency toggle
  const handleDependencyToggle = (taskId) => {
    setNewTask(prev => {
      const deps = prev.dependencies.includes(taskId)
        ? prev.dependencies.filter(id => id !== taskId)
        : [...prev.dependencies, taskId];
      return { ...prev, dependencies: deps };
    });
  };

  // Render tasks in column
  const renderTasks = (status) => {
    return tasks.filter(task => task.status === status).map(task => (
      <div key={task.id} className={styles.taskCard}>
        <div className={styles.taskTitle}>{task.title}</div>
        <div className={styles.taskDesc}>{task.description}</div>
        {task.dependencies.length > 0 && (
          <div className={styles.taskDeps}>
            <span>Depends on: </span>
            {task.dependencies.map(depId => {
              const dep = tasks.find(t => t.id === depId);
              return dep ? <span key={depId}>{dep.title}</span> : null;
            })}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.terminalView}>
      <div className={styles.header}>Terminal Project Management</div>
      <div className={styles.tabButtons}>
        <button className={activeTab === 'task' ? styles.active : ''} onClick={() => setActiveTab('task')}>Task</button>
        <button className={activeTab === 'column' ? styles.active : ''} onClick={() => setActiveTab('column')}>Column</button>
      </div>

      {/* Add New Column */}
      {activeTab === 'column' && (
        <div className={styles.addColumnBox}>
          <div>Add New Column</div>
          <input value={newColumn} onChange={e => setNewColumn(e.target.value)} placeholder="Column Title" />
          <button onClick={handleAddColumn}>Add</button>
          <button onClick={() => setNewColumn('')}>Cancel</button>
        </div>
      )}

      {/* Add New Task */}
      {activeTab === 'task' && (
        <div className={styles.addTaskBox}>
          <div>Add New Task</div>
          <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task Title" />
          <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task Description" />
          <div>Dependencies:</div>
          <div className={styles.dependencyList}>
            {tasks.map(task => (
              <div key={task.id}>
                <input
                  type="checkbox"
                  checked={newTask.dependencies.includes(task.id)}
                  onChange={() => handleDependencyToggle(task.id)}
                />
                <span>{task.title}</span>
              </div>
            ))}
          </div>
          <button onClick={handleAddTask}>Create</button>
          <button onClick={() => setNewTask({ title: '', description: '', dependencies: [] })}>Cancel</button>
        </div>
      )}

      {/* Kanban Board */}
      <div className={styles.kanbanBoard}>
        {columns.map(col => (
          <div key={col.id} className={styles.columnBox}>
            <div className={styles.columnHeader}>{col.title}</div>
            <div className={styles.taskList}>{renderTasks(col.id)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalView;
