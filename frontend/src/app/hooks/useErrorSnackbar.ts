import { useMemo } from 'react'
import { ErrorCode } from 'berta-snakes-shared'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import type { KeyType } from '../../i18n'

const ErrorMessageMapper: { [key in ErrorCode]: KeyType } = {
  [ErrorCode.DATABASE_SEARCH_ERROR]: 'validation:common.databaseSearchError',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'validation:email.inUse',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'validation:username.taken',
  [ErrorCode.EMAIL_SENDING_ERROR]: 'error:email.sendingError',
  [ErrorCode.INVALID_ERROR_CONFIRMATION_CODE]:
    'error:email.invalidConfirmationCode',
}

export function useErrorSnackbar() {
  const { enqueueSnackbar } = useSnackbar()
  const [t] = useTranslation()

  return useMemo(() => {
    return {
      enqueueErrorSnackbar: (
        errorCode: ErrorCode | undefined | null,
        fallbackMessage: string,
      ) => {
        return enqueueSnackbar(
          errorCode !== undefined &&
            errorCode !== null &&
            ErrorMessageMapper[errorCode]
            ? t(ErrorMessageMapper[errorCode])
            : fallbackMessage,
          { variant: 'error' },
        )
      },
    }
  }, [enqueueSnackbar, t])
}
