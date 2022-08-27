import { searchUsers } from '../user'
import { useApiMutation } from './useApiMutation'

export function useSearchUsers() {
  const mutation = useApiMutation(searchUsers)

  return {
    isLoading: mutation.isLoading,
    users: mutation.data?.data,
    searchUsers: mutation.mutate,
  }
}
