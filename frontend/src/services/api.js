import axios from 'axios';

const api = axios.create({
  baseURL: '', // uses Vite proxy
  analyze: (data) => api.post('/api/news/analyze', data),
});

export const newsAPI = {
  analyze: (data) => {
  const formData = new FormData();
  formData.append("text", data.text);

  return api.post('/api/news/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
}

export default api;