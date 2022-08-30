import { useMemo } from 'react'
import { AxiosError } from 'axios'
import { ErrorCode } from 'berta-snakes-shared'
import type { SnackbarKey } from 'notistack'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import type { KeyType } from '../../i18n'

const ErrorMessageMapper: { [key in ErrorCode]: KeyType } = {
  [ErrorCode.UNKNOWN]: 'error:unknown',
  [ErrorCode.DATABASE_SEARCH_ERROR]: 'validation:common.databaseSearchError',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'validation:email.inUse',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'validation:username.taken',
  [ErrorCode.USERNAME_OR_EMAIL_DOES_NOT_EXIST]:
    'error:usernameOrEmailDoesNotExist',
  [ErrorCode.USER_NOT_FOUND]: 'error:userNotFound',
  [ErrorCode.INCORRECT_PASSWORD]: 'error:incorrectPassword',
  [ErrorCode.EMAIL_SENDING_ERROR]: 'error:email.sendingError',
  [ErrorCode.INVALID_ERROR_CONFIRMATION_CODE]:
    'error:email.invalidConfirmationCode',
  [ErrorCode.SESSION_NOT_FOUND]: 'error:sessionNotFound',
  [ErrorCode.NO_ACCESS_TOKEN_PROVIDED]: 'error:noAccessTokenProvided',
  [ErrorCode.CANNOT_OPEN_FILE]: 'error:file.cannotOpen',
  [ErrorCode.FILE_TOO_LARGE]: 'error:file.tooLarge',
}

export function useErrorSnackbar() {
  const { enqueueSnackbar } = useSnackbar()
  const [t] = useTranslation()

  return useMemo<{
    enqueueErrorSnackbar: (
      error: AxiosError | undefined | null | unknown,
      fallbackMessage: string,
    ) => SnackbarKey
  }>(() => {
    return {
      enqueueErrorSnackbar: (error, fallbackMessage) => {
        const errorCode =
          error instanceof AxiosError
            ? (error.response?.data as { error?: ErrorCode }).error
            : undefined
        return enqueueSnackbar(
          errorCode !== undefined && ErrorMessageMapper[errorCode]
            ? t(ErrorMessageMapper[errorCode])
            : fallbackMessage,
          { variant: 'error' },
        )
      },
    }
  }, [enqueueSnackbar, t])
}
