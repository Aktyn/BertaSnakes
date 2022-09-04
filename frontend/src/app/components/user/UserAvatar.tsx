import { AccountCircleRounded } from '@mui/icons-material'
import { Avatar } from '@mui/material'
import type { UserPublic } from 'berta-snakes-shared'
import { roleColor } from '../../../configs/common.config'

interface UserAvatarProps {
  user: UserPublic
}

export const UserAvatar = ({ user }: UserAvatarProps) => {
  return (
    <Avatar
      sx={{
        backgroundColor: 'transparent',
        color: (theme) => theme.palette.text.primary,
        height: '24px',
        width: '24px',
        border: `1px solid ${roleColor[user.role]}`,
      }}
    >
      {user.avatar ? (
        <img
          src={'data:image;base64,' + user.avatar}
          alt="account-avatar"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <AccountCircleRounded
          color="inherit"
          sx={{ height: '100%', width: '100%' }}
        />
      )}
    </Avatar>
  )
}
