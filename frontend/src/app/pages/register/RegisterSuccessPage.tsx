import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ZoomEnter } from '../../components/transition/ZoomEnter'

const RegisterSuccessPage = () => {
  const [t] = useTranslation()

  return (
    <Stack alignItems="center" p={4} spacing={4}>
      <ZoomEnter>
        <Typography
          textAlign="center"
          variant="h3"
          sx={{ fontFamily: "'Luckiest Guy', 'Roboto'" }}
        >
          {t('register:successPageTitle')}
        </Typography>
      </ZoomEnter>
      <ZoomEnter delay={500}>
        <Typography
          textAlign="center"
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {t('register:successPageInfo')}
        </Typography>
      </ZoomEnter>
    </Stack>
  )
}

export default RegisterSuccessPage
