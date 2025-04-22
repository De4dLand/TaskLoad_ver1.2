import React from 'react'
import TaskGrid from '../TaskGrid/TaskGrid'

const GridView = ({ tasks, onTaskClick, onTaskContextMenu }) => (
  <TaskGrid
    tasks={tasks}
    onTaskClick={onTaskClick}
    onTaskContextMenu={onTaskContextMenu}
  />
)

export default GridView
