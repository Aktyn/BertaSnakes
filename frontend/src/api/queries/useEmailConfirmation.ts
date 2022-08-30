import { confirmEmail } from '../user'
import { useApiMutation } from './useApiMutation'

export function useEmailConfirmation() {
  const mutation = useApiMutation(confirmEmail)

  return {
    isLoading: mutation.isLoading,
    users: mutation.data?.data,
    confirmEmail: mutation.mutate,
  }
}
