import API from './api'

export const groceryService = {
  getList: () => API.get('/grocery/'),
  checkItem: (id, data) => API.patch(`/grocery/check/${id}/`, data),
  refreshList: () => API.post('/grocery/refresh/'),
}