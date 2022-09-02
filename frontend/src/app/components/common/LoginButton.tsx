import { useState, useEffect } from 'react'
import { LoginRounded } from '@mui/icons-material'
import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { LoginDialog } from '../dialog/LoginDialog'

export const LoginButton = () => {
  const [t] = useTranslation()
  const auth = useAuth()

  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  useEffect(() => {
    if (loginDialogOpen && !!auth.user) {
      setLoginDialogOpen(false)
    }
  }, [auth.user, loginDialogOpen])

  return (
    <>
      <Button
        size="small"
        color="primary"
        variant="contained"
        startIcon={<LoginRounded />}
        onClick={() => setLoginDialogOpen(true)}
        fullWidth
      >
        {t('common:logIn').toUpperCase()}
      </Button>
      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  )
}
