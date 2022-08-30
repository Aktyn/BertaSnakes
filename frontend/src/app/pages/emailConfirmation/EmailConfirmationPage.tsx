import { useEffect, useState } from 'react'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useEmailConfirmation } from '../../../api/queries/useEmailConfirmation'
import { useAuth } from '../../auth/AuthProvider'
import { ZoomEnter } from '../../components/transition/ZoomEnter'
import { useErrorSnackbar } from '../../hooks/useErrorSnackbar'
import useQueryParams from '../../hooks/useQueryParams'

enum STATUS {
  PENDING,
  SUCCESS,
  ERROR,
}

const EmailConfirmationPage = () => {
  const [t] = useTranslation()
  const params = useQueryParams()
  const { confirmEmail, isLoading } = useEmailConfirmation()
  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()
  const auth = useAuth()

  const [status, setStatus] = useState(STATUS.PENDING)

  useEffect(() => {
    if (typeof params.code !== 'string') {
      return
    }

    confirmEmail(
      { confirmationCode: params.code.replaceAll(' ', '+') },
      {
        onSuccess: (response) => {
          enqueueSnackbar(t('register:form.success'), { variant: 'success' })
          setStatus(STATUS.SUCCESS)
          if (response.data) {
            auth.setSession(response.data)
          }
        },
        onError: (err) => {
          enqueueErrorSnackbar(
            err,
            t('emailConfirmation:confirmationUnsuccessful'),
          )
          setStatus(STATUS.ERROR)
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code])

  if (!params.code) {
    return (
      <Stack alignItems="center" p={4} spacing={4}>
        <ZoomEnter>
          <Typography
            textAlign="center"
            variant="body1"
            sx={{ whiteSpace: 'pre-wrap' }}
          >
            {t('emailConfirmation:incorrectUrlInfo')}
          </Typography>
        </ZoomEnter>
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" p={4} spacing={4}>
        <CircularProgress color="inherit" />
      </Stack>
    )
  }

  return (
    <Stack alignItems="center" p={4} spacing={4}>
      <ZoomEnter>
        <Typography
          textAlign="center"
          variant={status === STATUS.SUCCESS ? 'h3' : 'h5'}
          sx={{
            fontFamily: "'Luckiest Guy', 'Roboto'",
            whiteSpace: 'pre-wrap',
          }}
        >
          {status === STATUS.PENDING
            ? t('emailConfirmation:pendingTitle')
            : status === STATUS.SUCCESS
            ? t('emailConfirmation:successTitle')
            : status === STATUS.ERROR
            ? t('emailConfirmation:errorTitle')
            : '-'}
        </Typography>
      </ZoomEnter>
    </Stack>
  )
}

export default EmailConfirmationPage
