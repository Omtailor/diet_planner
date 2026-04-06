import API from './api'

export const trainingService = {
  getWeeklyPlan: () => API.get('/training/weekly/'),
  getDayTraining: (date) => API.get(`/training/day/${date}/`),
  generatePlan: () => API.post('/training/generate/'),
  generateNextWeek: (weekStart) => API.post('/training/generate/', { week_start: weekStart }),  // ← ADD
}