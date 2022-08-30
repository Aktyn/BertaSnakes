import { useState } from 'react'
import { joiResolver } from '@hookform/resolvers/joi'
import {
  AccountCircleRounded,
  AppRegistrationRounded,
  KeyRounded,
  LoginRounded,
} from '@mui/icons-material'
import type { DialogProps } from '@mui/material'
import {
  InputAdornment,
  Divider,
  Stack,
  DialogContentText,
  Button,
} from '@mui/material'
import { pick } from 'berta-snakes-shared'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import useCancellablePromise from '../../hooks/useCancellablePromise'
import Navigation from '../../navigation'
import { FormInput } from '../form/FormInput'
import { DecisionDialog } from './DecisionDialog'
import { loginSchema } from './loginSchema'

interface LoginDialogProps extends Omit<DialogProps, 'title' | 'onClose'> {
  onClose: () => void
}

export const LoginDialog = ({ onClose, ...dialogProps }: LoginDialogProps) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const cancellable = useCancellablePromise()
  const auth = useAuth()

  const [isLoggingIn, setIsLoggingIn] = useState(false)

  type FieldsType = {
    login: string //username or email
    password: string
  }

  const { control, handleSubmit } = useForm<FieldsType>({
    resolver: joiResolver(loginSchema),
    defaultValues:
      process.env.NODE_ENV === 'development'
        ? {
            login: 'Dummy User',
            password: 'Password2@',
          }
        : undefined,
  })

  const handleLogin = (data: FieldsType) => {
    setIsLoggingIn(true)
    cancellable(auth.login(data.login, data.password))
      .then((success) => {
        setIsLoggingIn(false)
        if (success) {
          onClose()
        }
      })
      .catch((err) => err && setIsLoggingIn(false))
  }

  return (
    <DecisionDialog
      onClose={onClose}
      onConfirm={handleSubmit((formData) =>
        handleLogin(pick(formData, 'login', 'password')),
      )}
      title={t('dialog:login.title')}
      confirmEndIcon={<LoginRounded />}
      confirmContent={t('common:logIn')}
      disableConfirm={isLoggingIn}
      loading={isLoggingIn}
      {...dialogProps}
    >
      <Stack alignItems="center" spacing={1}>
        <DialogContentText variant="body2">
          {t('dialog:login.noAccountInfo')}
        </DialogContentText>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => navigate(Navigation.REGISTER.path)}
          endIcon={<AppRegistrationRounded />}
        >
          {t('common:goToRegisterPage')}
        </Button>
      </Stack>
      <Divider variant="fullWidth" />
      <Stack alignItems="center" spacing={3}>
        <FormInput
          required
          control={control}
          name="login"
          label={t('dialog:login.form.usernameOrEmail')}
          fullWidth
          inputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircleRounded />
              </InputAdornment>
            ),
          }}
          autoFocus
          autoComplete="username,email"
          disabled={isLoggingIn}
        />
        <FormInput
          required
          control={control}
          name="password"
          label={t('dialog:login.form.password')}
          type="password"
          allowPasswordPreview
          fullWidth
          inputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <KeyRounded />
              </InputAdornment>
            ),
          }}
          autoComplete="password"
          disabled={isLoggingIn}
        />
      </Stack>
    </DecisionDialog>
  )
}
