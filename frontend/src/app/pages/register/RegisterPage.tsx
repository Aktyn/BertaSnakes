import { useEffect, useState } from 'react'
import { joiResolver } from '@hookform/resolvers/joi'
import {
  AccountCircleRounded,
  AlternateEmailRounded,
  KeyRounded,
  SendRounded,
} from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, InputAdornment, Stack, Typography } from '@mui/material'
import { pick } from 'berta-snakes-shared'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRegister } from '../../../api/queries/useRegister'
import { searchUsers } from '../../../api/user'
import { zoomDelay } from '../../../utils/common'
import { FormInput } from '../../components/form/FormInput'
import { ZoomEnter } from '../../components/transition/ZoomEnter'
import { useCancellablePromise } from '../../hooks/useCancellablePromise'
import { useDebounce } from '../../hooks/useDebounce'
import { registerSchema } from './registerSchema'

const RegisterPage = () => {
  const [t] = useTranslation()
  const cancellable = useCancellablePromise()

  type FieldsType = {
    name: string
    email: string
    password: string
    confirmPassword: string
  }

  const { control, formState, handleSubmit, watch, setError, clearErrors } =
    useForm<FieldsType>({
      resolver: joiResolver(registerSchema),
      defaultValues:
        process.env.NODE_ENV === 'development'
          ? {
              name: 'Dummy User',
              email: 'example@email.com',
              password: 'Password2@',
              confirmPassword: 'Password2@',
            }
          : undefined,
    })

  const name = watch('name')
  const email = watch('email')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  const [checkingNameAvailability, setCheckingNameAvailability] =
    useState(false)
  const [checkingEmailAvailability, setCheckingEmailAvailability] =
    useState(false)

  const checkUsernameAvailability = useDebounce(
    (name: string) => {
      if (!name?.length) {
        clearErrors('name')
        return
      }
      if (formState.errors.name?.message) {
        return
      }
      setCheckingNameAvailability(true)
      cancellable(searchUsers({ name, pageSize: 1, page: 0 }))
        .then((response) => {
          setCheckingNameAvailability(false)
          if (response?.data?.total) {
            setError('name', { message: t('validation:username.taken') })
          } else if (
            formState.errors.name?.message === t('validation:username.taken')
          ) {
            clearErrors('name')
          }
        })
        .catch((err) => err && setCheckingNameAvailability(false))
    },
    400,
    [name, formState.errors.name?.message],
  )
  const checkEmailAvailability = useDebounce(
    (email: string) => {
      if (!email?.length) {
        clearErrors('email')
        return
      }
      if (formState.errors.email?.message) {
        return
      }
      setCheckingEmailAvailability(true)
      cancellable(searchUsers({ email, pageSize: 1, page: 0 }))
        .then((response) => {
          setCheckingEmailAvailability(false)
          if (response?.data?.total) {
            setError('email', { message: t('validation:email.inUse') })
          } else if (
            formState.errors.email?.message === t('validation:email.inUse')
          ) {
            clearErrors('email')
          }
        })
        .catch((err) => err && setCheckingEmailAvailability(false))
    },
    400,
    [email, formState.errors.email?.message],
  )

  useEffect(
    () => checkUsernameAvailability(name),
    [checkUsernameAvailability, name],
  )
  useEffect(
    () => checkEmailAvailability(email),
    [checkEmailAvailability, email],
  )

  const { handleRegister, isLoading: isRegistering } = useRegister()

  return (
    <Stack alignItems="center" p={4} spacing={4}>
      <ZoomEnter>
        <Typography
          textAlign="center"
          variant="h3"
          sx={{ fontFamily: "'Luckiest Guy', 'Roboto'" }}
        >
          {t('register:pageTitle')}
        </Typography>
      </ZoomEnter>
      <Stack alignItems="stretch" spacing={3}>
        <ZoomEnter delay={zoomDelay * 1}>
          <Box>
            <FormInput
              required
              control={control}
              name="name"
              label={t('register:form.username')}
              fullWidth
              loading={checkingNameAvailability}
              inputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleRounded />
                  </InputAdornment>
                ),
              }}
              autoFocus
              autoComplete="off"
            />
          </Box>
        </ZoomEnter>
        <ZoomEnter delay={zoomDelay * 2}>
          <Box>
            <FormInput
              required
              control={control}
              name="email"
              label={t('register:form.email')}
              fullWidth
              loading={checkingEmailAvailability}
              inputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailRounded />
                  </InputAdornment>
                ),
              }}
              autoComplete="off"
            />
          </Box>
        </ZoomEnter>
        <ZoomEnter delay={zoomDelay * 3}>
          <Box>
            <FormInput
              required
              type="password"
              allowPasswordPreview
              control={control}
              name="password"
              label={t('register:form.password')}
              fullWidth
              inputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRounded />
                  </InputAdornment>
                ),
              }}
              autoComplete="off"
            />
          </Box>
        </ZoomEnter>
        <ZoomEnter delay={zoomDelay * 4}>
          <Box>
            <FormInput
              required
              type="password"
              allowPasswordPreview
              control={control}
              name="confirmPassword"
              label={t('register:form.confirmPassword')}
              fullWidth
              inputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRounded />
                  </InputAdornment>
                ),
              }}
              autoComplete="off"
            />
          </Box>
        </ZoomEnter>
      </Stack>
      <ZoomEnter delay={zoomDelay * 5}>
        <LoadingButton
          variant="contained"
          color="primary"
          size="large"
          endIcon={<SendRounded />}
          disabled={!name || !email || !password || !confirmPassword}
          loading={isRegistering}
          loadingPosition="end"
          onClick={handleSubmit((formData) =>
            handleRegister(pick(formData, 'name', 'email', 'password')),
          )}
        >
          {t('register:form.submit')}
        </LoadingButton>
      </ZoomEnter>
    </Stack>
  )
}

export default RegisterPage
