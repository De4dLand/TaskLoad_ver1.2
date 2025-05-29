import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';

/**
 * Service for team-related API operations
 */
const teamService = {
  /**
   * Get all teams
   * @returns {Promise} Promise object with teams data
   */
  getTeams: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TEAMS, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getTeams:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID
   * @param {string} teamId - The ID of the team to fetch
   * @returns {Promise} Promise object with team data
   */
  getTeamById: async (teamId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching team: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getTeamById:', error);
      throw error;
    }
  },

  /**
   * Create a new team
   * @param {Object} teamData - The team data to create
   * @returns {Promise} Promise object with created team data
   */
  createTeam: async (teamData) => {
    try {
      const response = await fetch(API_ENDPOINTS.TEAMS, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`Error creating team: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in createTeam:', error);
      throw error;
    }
  },

  /**
   * Update a team
   * @param {string} teamId - The ID of the team to update
   * @param {Object} teamData - The team data to update
   * @returns {Promise} Promise object with updated team data
   */
  updateTeam: async (teamId, teamData) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`Error updating team: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in updateTeam:', error);
      throw error;
    }
  },

  /**
   * Delete a team
   * @param {string} teamId - The ID of the team to delete
   * @returns {Promise} Promise object with deleted team data
   */
  deleteTeam: async (teamId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error deleting team: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      throw error;
    }
  },

  /**
   * Get team members
   * @param {string} teamId - The ID of the team
   * @returns {Promise} Promise object with team members data
   */
  getTeamMembers: async (teamId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}/members`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching team members: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      throw error;
    }
  },

  /**
   * Add a member to a team
   * @param {string} teamId - The ID of the team
   * @param {string} userId - The ID of the user to add
   * @returns {Promise} Promise object with updated team data
   */
  addTeamMember: async (teamId, userId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Error adding team member: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in addTeamMember:', error);
      throw error;
    }
  },

  /**
   * Remove a member from a team
   * @param {string} teamId - The ID of the team
   * @param {string} userId - The ID of the user to remove
   * @returns {Promise} Promise object with updated team data
   */
  removeTeamMember: async (teamId, userId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error removing team member: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in removeTeamMember:', error);
      throw error;
    }
  },

  /**
   * Update a team member's role
   * @param {string} teamId - The ID of the team
   * @param {string} userId - The ID of the user to update
   * @param {string} role - The new role for the user
   * @returns {Promise} Promise object with updated team data
   */
  updateMemberRole: async (teamId, userId, role) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}/members/${userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error(`Error updating member role: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      throw error;
    }
  },

  /**
   * Get team projects
   * @param {string} teamId - The ID of the team
   * @returns {Promise} Promise object with team projects data
   */
  getTeamProjects: async (teamId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEAMS}/${teamId}/projects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching team projects: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getTeamProjects:', error);
      throw error;
    }
  },
};

export default teamService;
