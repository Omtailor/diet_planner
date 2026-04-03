import API from './api'

export const cheatMealService = {
  uploadImage: (formData) => API.post('/cheat-meals/image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  manualEntry: (data) => API.post('/cheat-meals/manual/', data),
  followUp: (data) => API.post('/cheat-meals/manual/followup/', data),
  editCalories: (id, data) => API.patch(`/cheat-meals/${id}/edit/`, data),
  getHistory: () => API.get('/cheat-meals/history/'),
}