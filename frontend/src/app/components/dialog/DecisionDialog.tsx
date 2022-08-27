import type { FC, PropsWithChildren } from 'react'
import { css } from '@emotion/css'
import type { DialogProps } from '@mui/material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface DecisionDialogProps extends Omit<DialogProps, 'title' | 'onClose'> {
  onClose: () => void
  onConfirm: () => void
  title?: React.ReactNode
  cancelContent?: React.ReactNode
  confirmContent?: React.ReactNode
}

export const DecisionDialog: FC<PropsWithChildren<DecisionDialogProps>> = ({
  children,
  onClose,
  onConfirm,
  title,
  cancelContent,
  confirmContent,
  ...dialogProps
}) => {
  const [t] = useTranslation()

  return (
    <Dialog {...dialogProps}>
      <DialogTitle textAlign="center">{title}</DialogTitle>
      <DialogContent
        className={css`
          display: flex;
          flex-direction: column;
          row-gap: 2em;
        `}
      >
        {children}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {cancelContent ?? t('common:cancel')}
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm}>
          {confirmContent ?? t('common:confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
