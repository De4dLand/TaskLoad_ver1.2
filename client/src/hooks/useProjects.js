import { useState, useEffect } from 'react';
import api from '../services/api';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/projects');
        setProjects(response.data.projects || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
};
