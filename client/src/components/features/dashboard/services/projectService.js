import api from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints";

/**
 * Fetch all projects for the current user
 * @returns {Promise<Array>} - List of projects
 */
export const getProjects = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECTS.BASE);
    return response.data.projects || response.data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * Get a project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object>} - Project object
 */
export const getProjectById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECTS.getById(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new project
 * @param {Object} projectData - Project data matching the Project model schema
 * @returns {Promise<Object>} - Created project
 */
export const createProject = async (projectData) => {
  try {
    // Ensure data matches the backend model requirements
    const formattedData = formatProjectData(projectData);
    
    const response = await api.post(API_ENDPOINTS.PROJECTS.BASE, formattedData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} - Updated project
 */
export const updateProject = async (id, projectData) => {
  try {
    // Ensure data matches the backend model requirements
    const formattedData = formatProjectData(projectData);
    
    const response = await api.patch(API_ENDPOINTS.PROJECTS.getById(id), formattedData);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a project
 * @param {string} id - Project ID
 * @returns {Promise<Object>} - Response message
 */
export const deleteProject = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.PROJECTS.getById(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
};

/**
 * Get tasks for a specific project
 * @param {string} id - Project ID
 * @returns {Promise<Array>} - List of tasks
 */
export const getProjectTasks = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECTS.getTasks(id));
    return response.data.tasks || [];
  } catch (error) {
    console.error(`Error fetching tasks for project ${id}:`, error);
    throw error;
  }
};

/**
 * Add a member to a project
 * @param {string} projectId - Project ID
 * @param {Object} memberData - Member data {userId, role}
 * @returns {Promise<Object>} - Updated project
 */
export const addProjectMember = async (projectId, memberData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.PROJECTS.addMember(projectId), 
      memberData
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding member to project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Remove a member from a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated project
 */
export const removeProjectMember = async (projectId, userId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.PROJECTS.removeMember(projectId, userId)
    );
    return response.data;
  } catch (error) {
    console.error(`Error removing member from project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Helper function to format project data to match backend model requirements
 * @param {Object} projectData - Raw project data from form
 * @returns {Object} - Formatted project data
 */
const formatProjectData = (projectData) => {
  const formattedData = {
    name: projectData.name,
    description: projectData.description || "",
    color: projectData.color || "#1976d2",
    status: projectData.status || "planning",
  };
  
  // Handle required dates - ensure they're ISO strings
  if (projectData.startDate) {
    formattedData.startDate = new Date(projectData.startDate).toISOString();
  } else {
    formattedData.startDate = new Date().toISOString(); // Default to current date
  }
  
  if (projectData.endDate) {
    formattedData.endDate = new Date(projectData.endDate).toISOString();
  } else {
    // Default to 1 month from start date if not provided
    const defaultEndDate = new Date(formattedData.startDate);
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
    formattedData.endDate = defaultEndDate.toISOString();
  }
  
  // Optional fields
  if (projectData.template) {
    formattedData.template = projectData.template;
  }
  
  if (projectData.team) {
    formattedData.team = projectData.team;
  }
  
  if (projectData.tags && projectData.tags.length > 0) {
    formattedData.tags = projectData.tags;
  }
  
  if (projectData.budget) {
    formattedData.budget = projectData.budget;
  }
  
  return formattedData;
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  addProjectMember,
  removeProjectMember
};
