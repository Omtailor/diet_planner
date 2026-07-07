import API from './api'

// ─── Named service functions used by CheatMeal.jsx ──────────────

export const submitImageMeal = (formData) =>
  API.post('/cheat-meals/image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const submitManualMeal = (data) =>
  API.post('/cheat-meals/manual/', data)

export const submitFollowUpAnswer = (data) =>
  API.post('/cheat-meals/manual/followup/', data)

// ─── Object-style API (used by other pages) ─────────────────────

export const cheatMealService = {
  uploadImage: submitImageMeal,
  manualEntry: submitManualMeal,
  followUp: submitFollowUpAnswer,
  editCalories: (id, data) => API.patch(`/cheat-meals/${id}/edit/`, data),
  getHistory: () => API.get('/cheat-meals/history/'),
}
