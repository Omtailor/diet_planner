import API from './api'

export const groceryService = {
  checkItem: (id, data) => API.patch(`/grocery/check/${id}/`, data),
}