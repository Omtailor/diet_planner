import API from './api'

export const submitImageMeal = (formData) =>
  API.post('/cheat-meals/image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const submitManualMeal = (data) =>
  API.post('/cheat-meals/manual/', data)

export const submitFollowUpAnswer = (data) =>
  API.post('/cheat-meals/manual/followup/', data)
