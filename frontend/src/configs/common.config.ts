import { blueGrey, amber, purple } from '@mui/material/colors'
import { UserRole } from 'berta-snakes-shared'

export const basename = '/web'

export const roleColor = {
  [UserRole.REGULAR]: blueGrey[300],
  [UserRole.MODERATOR]: amber[300],
  [UserRole.ADMIN]: purple[300],
}
