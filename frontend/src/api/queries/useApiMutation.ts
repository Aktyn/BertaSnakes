import type { AxiosError } from 'axios'
import { useSnackbar } from 'notistack'
import type { MutationFunction } from 'react-query'
import { useMutation } from 'react-query'

export function useApiMutation<TVariables = unknown, TData = unknown>(
  apiRequest: MutationFunction<TData, TVariables>,
  onSuccess?:
    | ((
        data: TData,
        variables: TVariables,
        context: unknown,
      ) => void | Promise<unknown>)
    | undefined,
  onError?: string | ((error: AxiosError) => void),
) {
  const { enqueueSnackbar } = useSnackbar()

  return useMutation(apiRequest, {
    onSuccess,
    onError:
      typeof onError === 'string'
        ? () => enqueueSnackbar(onError, { variant: 'error' })
        : onError,
  })
}
