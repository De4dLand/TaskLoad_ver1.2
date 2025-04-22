import React from 'react'
import TaskList from '../TaskList/TaskList'

const ListView = ({ tasks, onTaskClick, onTaskContextMenu }) => (
  <TaskList
    tasks={tasks}
    onTaskClick={onTaskClick}
    onTaskContextMenu={onTaskContextMenu}
  />
)

export default ListView
