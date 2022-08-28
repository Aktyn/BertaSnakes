import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useErrorSnackbar } from '../../app/hooks/useErrorSnackbar'
import Navigation from '../../app/navigation'
import { register } from '../user'
import { useApiMutation } from './useApiMutation'

export function useRegister() {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const mutation = useApiMutation(
    register,
    (_, request) => {
      enqueueSnackbar(t('register:form.success'), { variant: 'success' })
      navigate(Navigation.REGISTER_SUCCESS.path, {
        state: { email: request.email },
      })
    },
    (err) => {
      enqueueErrorSnackbar(err, t('register:form.error'))
    },
  )

  return {
    isLoading: mutation.isLoading,
    handleRegister: mutation.mutate,
  }
}
