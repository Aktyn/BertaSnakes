import { joiResolver } from '@hookform/resolvers/joi'
import {
  AccountCircleRounded,
  AlternateEmailRounded,
  KeyRounded,
  SendRounded,
} from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, InputAdornment, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRegister } from '../../../api/queries/useRegister'
import { zoomDelay } from '../../../utils/common'
import { FormInput } from '../../components/form/FormInput'
import { ZoomEnter } from '../../components/transition/ZoomEnter'
import { registerSchema } from './registerSchema'

const RegisterPage = () => {
  const [t] = useTranslation()

  type FieldsType = {
    name: string
    email: string
    password: string
    confirmPassword: string
  }

  const {
    control,
    handleSubmit,
    watch,
    // formState: { errors },
  } = useForm<FieldsType>({
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

  const { handleRegister, isLoading } = useRegister({
    name,
    email,
    password,
  })

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
      <Stack alignItems="center" spacing={3}>
        <ZoomEnter delay={zoomDelay * 1}>
          <Box>
            <FormInput
              required
              control={control}
              name="name"
              label={t('register:form.username')}
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
              control={control}
              name="password"
              label={t('register:form.password')}
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
              control={control}
              name="confirmPassword"
              label={t('register:form.confirmPassword')}
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
          loading={isLoading}
          loadingPosition="end"
          onClick={handleSubmit(handleRegister)}
        >
          {t('register:form.submit')}
        </LoadingButton>
      </ZoomEnter>
    </Stack>
  )
}

export default RegisterPage
