import axios from 'axios'
import { apiUrl } from '~/constant'
import { convertDate } from './date'

const client = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
})

client.interceptors.response.use(
  (response) => {
    convertDate(response.data)
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export {
  client as request,
}
