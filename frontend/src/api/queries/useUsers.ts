import type { SearchUserRequest } from 'berta-snakes-shared'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { useErrorSnackbar } from '../../app/hooks/useErrorSnackbar'
import { searchUsers } from '../user'

export function useUsers(searchRequest?: SearchUserRequest) {
  const [t] = useTranslation()
  // const mutation = useApiMutation(searchUsers)

  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const page = 0

  const usersQuery = useQuery(
    `/users?page=${page}`,
    () =>
      searchRequest
        ? searchUsers({ ...searchRequest, page, pageSize: 2 }) //TODO: remove pageSize
        : Promise.resolve(null),
    {
      onError: (err) => {
        enqueueErrorSnackbar(err, t('user:error.cannotFetchUsers'))
      },
    },
  )

  return {
    users: usersQuery.data?.data,
    usersFetching: usersQuery.isFetching || usersQuery.isLoading,
    refetchUsers: usersQuery.refetch,
  }
}
