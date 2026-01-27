import axios from 'axios'
import { buildWebStorage, setupCache } from 'axios-cache-interceptor'
import { apiUrl } from '../constant'
import { convertDate } from './date'

const storage = typeof sessionStorage === 'undefined' ? {} : sessionStorage

const client = setupCache(
  axios.create({
    baseURL: apiUrl,
    timeout: 10000,
  }),
  {
    storage: buildWebStorage(storage as any),
  },
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
