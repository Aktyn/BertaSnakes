import { useCallback } from 'react'
import type { CreateUserRequest } from 'berta-snakes-shared'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Navigation from '../../app/navigation'
import { register } from '../user'
import { useApiMutation } from './useApiMutation'

export function useRegister(createUserRequest: CreateUserRequest) {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const mutation = useApiMutation(
    () => register(createUserRequest),
    () => {
      enqueueSnackbar(t('register:form.success'), { variant: 'success' })
      navigate(Navigation.REGISTER_SUCCESS.path, {
        state: { email: createUserRequest.email },
      })
    },
    t('register:form.error'),
  )

  const handleRegister = useCallback(() => {
    mutation.mutate(undefined)
  }, [mutation])

  return {
    isLoading: mutation.isLoading,
    handleRegister,
  }
}
