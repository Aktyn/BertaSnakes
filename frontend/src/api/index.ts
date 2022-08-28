import axios from 'axios'
import { Config } from 'berta-snakes-shared'

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
})

export function setAuthorizationHeader(token: string) {
  api.defaults.headers.common['Authorization'] = token
}

export function removeAuthorizationHeader() {
  delete api.defaults.headers.common['Authorization']
  localStorage.removeItem(Config.LOCAL_STORAGE.ACCESS_TOKEN_KEY)
}

export function hasAuthorizationHeader() {
  return !!api.defaults.headers.common['Authorization']
}

const accessToken = localStorage.getItem(Config.LOCAL_STORAGE.ACCESS_TOKEN_KEY)
if (accessToken) {
  setAuthorizationHeader(accessToken)
}
