import { Chip, lighten } from '@mui/material'
import type { UserPublic } from 'berta-snakes-shared'
import { useTranslation } from 'react-i18next'
import { roleColor } from '../../../configs/common.config'

interface UserRoleChipProps {
  user: UserPublic
}

export const UserRoleChip = ({ user }: UserRoleChipProps) => {
  const [t] = useTranslation()

  return (
    <Chip
      label={t(`common:roleName.${user.role}`)}
      variant="outlined"
      size="small"
      sx={{
        fontWeight: 'bold',
        borderColor: roleColor[user.role],
        color: lighten(roleColor[user.role], 0.5),
      }}
    />
  )
}
