import { useSnackbar } from 'notistack'
import type { MutationFunction } from 'react-query'
import { useMutation } from 'react-query'

export function useApiMutation<TVariables = unknown, TData = unknown>(
  apiRequest: MutationFunction<TData, TVariables>,
  onSuccess: () => void,
  errorMessage: string,
) {
  const { enqueueSnackbar } = useSnackbar()

  return useMutation(apiRequest, {
    onSuccess,
    onError: () => {
      enqueueSnackbar(errorMessage, { variant: 'error' })
    },
  })
}
