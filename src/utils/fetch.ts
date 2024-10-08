import axios from 'axios'
import { apiUrl } from '~/constant'

const client = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
})

export {
  client as request,
}
