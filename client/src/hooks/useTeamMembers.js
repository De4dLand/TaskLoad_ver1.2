import { useState, useEffect } from 'react';
import api from '../services/api';

export const useTeamMembers = (projectId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't fetch if no project is selected
    if (!projectId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/projects/${projectId}/members`);
        setMembers(response.data.members || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError(err.message || 'Failed to fetch team members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [projectId]);

  return { members, loading, error };
};
