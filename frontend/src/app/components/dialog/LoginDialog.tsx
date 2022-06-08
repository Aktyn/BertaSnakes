import { css } from '@emotion/css'
import {
  AccountCircleRounded,
  AppRegistrationRounded,
  KeyRounded,
} from '@mui/icons-material'
import type { DialogProps } from '@mui/material'
import {
  TextField,
  InputAdornment,
  Divider,
  Stack,
  DialogContentText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Navigation from '../../navigation'

interface LoginDialogProps extends Omit<DialogProps, 'title' | 'onClose'> {
  onClose: () => void
}

export const LoginDialog = ({ onClose, ...dialogProps }: LoginDialogProps) => {
  const [t] = useTranslation()
  const navigate = useNavigate()

  return (
    <Dialog {...dialogProps}>
      <DialogTitle textAlign="center">{t('dialog:login.title')}</DialogTitle>
      <DialogContent
        className={css`
          display: flex;
          flex-direction: column;
          row-gap: 2em;
        `}
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
        <Stack alignItems="center" spacing={4}>
          <TextField
            label={t('dialog:login.form.usernameOrEmail')}
            required
            autoFocus
            autoComplete="username,email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircleRounded />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label={t('dialog:login.form.password')}
            type="password"
            required
            autoComplete="password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyRounded />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button variant="contained" color="primary">
          {t('common:logIn')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
