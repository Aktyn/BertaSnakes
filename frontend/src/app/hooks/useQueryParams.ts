import queryString from 'qs'
import { useLocation } from 'react-router-dom'

export default function useQueryParams() {
  const location = useLocation()
  return queryString.parse(location.search, { ignoreQueryPrefix: true })
}
