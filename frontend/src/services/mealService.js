import API from './api'

export const mealService = {
  getWeeklyPlan: () => API.get('/meals/weekly/'),
  getDayMeal: (date, opts) => API.get(`/meals/day/${date}/`, opts),
  generatePlan: () => API.post('/meals/generate/', null, { timeout: 180000 }),
  regenerateDay: (date) => API.post('/meals/regenerate-day/', { date }),
  generateNextWeek: () => API.post('/meals/generate-next-week/', null, { timeout: 180000 }),
  getLatestPlan: () => API.get('/meals/latest/'),
  getBatchDayMeals: (dates, opts) => API.get(`/meals/batch/?dates=${dates.join(',')}`, opts),
  getAllDays: () => API.get('/meals/all-days/'),
}