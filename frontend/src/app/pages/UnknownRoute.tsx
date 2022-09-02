import { useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useInterval } from '../hooks/useInterval'
import Navigation from '../navigation'

export const UnknownRoute = () => {
  const [t] = useTranslation()
  const navigate = useNavigate()

  const [timeToRedirect, setTimeToRedirect] = useState(6)

  useEffect(() => {
    if (timeToRedirect === 0) {
      navigate(Navigation.DEFAULT_PAGE.path)
    }
  }, [navigate, timeToRedirect])

  useInterval(() => {
    setTimeToRedirect((time) => time - 1)
  }, 1000)

  return (
    <Stack
      textAlign="center"
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '100vh',
      }}
    >
      <Typography variant="h2" fontWeight={700}>
        {t('error:404.code')}
      </Typography>
      <Typography variant="h4">{t('error:404.name').toUpperCase()}</Typography>
      <Typography variant="body1">
        {t('error:404.redirectingInfo', { timeToRedirect })}
      </Typography>
    </Stack>
  )
}
