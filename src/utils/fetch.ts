import axios from 'axios'
import { setupCache, buildWebStorage } from 'axios-cache-interceptor'
import { apiUrl } from '~/constant'
import { convertDate } from './date'

const client = setupCache(
  axios.create({
    baseURL: apiUrl,
    timeout: 10000,
  }),
  {
  storage: buildWebStorage(localStorage, "axios-cache:"),
}
)

client.interceptors.response.use(
  (response) => {
    convertDate(response.data)
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export { client as request }
