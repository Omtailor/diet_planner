import API from './api'

export const authService = {
  register: (data) => API.post('/auth/register/', data),
  login: (data) => API.post('/auth/login/', data),
  onboarding: (data) => API.post('/auth/onboarding/', data),
  getProfile: () => API.get('/auth/profile/'),
  updateProfile: (data) => API.patch('/auth/profile/', data),
}