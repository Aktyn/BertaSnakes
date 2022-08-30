import type { Context, FC, PropsWithChildren } from 'react'
import {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  createContext,
} from 'react'
import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material'
import { AxiosError } from 'axios'
import type { UserPrivate, UserSessionData } from 'berta-snakes-shared'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import {
  api,
  hasAuthorizationHeader,
  removeAuthorizationHeader,
  setAuthorizationHeader,
} from '../../api'
import { getMe, login as sendLoginRequest } from '../../api/user'
import useCancellablePromise from '../hooks/useCancellablePromise'
import { useErrorSnackbar } from '../hooks/useErrorSnackbar'

const AuthContext = createContext({
  user: null as UserPrivate | null,
  login: (_usernameOrEmail: string, _password: string) =>
    Promise.resolve(false),
  logout: () => void 0 as void,
  setSession: (_session: UserSessionData) => void 0 as void,
  updateUserData: (_data: Partial<UserPrivate>) => void 0 as void,
})

type AuthContextType = typeof AuthContext extends Context<infer Type>
  ? Type
  : never

const hasAccessToken = hasAuthorizationHeader()

export const AuthProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [t] = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()
  const cancellable = useCancellablePromise()

  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [fetchingAccountData, setFetchingAccountData] = useState(hasAccessToken)

  const setSession = useCallback<AuthContextType['setSession']>((session) => {
    setAuthorizationHeader(session.accessToken)
    setUser(session.user)
  }, [])

  const removeSession = useCallback(() => {
    removeAuthorizationHeader()
    setUser(null)
  }, [])

  const login = useCallback<AuthContextType['login']>(
    async (usernameOrEmail, password) => {
      try {
        const userSession = await sendLoginRequest({
          usernameOrEmail,
          password,
        })
        setSession(userSession.data)
        enqueueSnackbar(t('common:login.success'), { variant: 'success' })
        return true
      } catch (err) {
        enqueueErrorSnackbar(
          err instanceof AxiosError ? err : null,
          t('common:login.error'),
        )
        return false
      }
    },
    [enqueueErrorSnackbar, enqueueSnackbar, setSession, t],
  )

  useEffect(() => {
    if (hasAccessToken) {
      setFetchingAccountData(true)
      cancellable(getMe())
        .then((user) => {
          if (user.data) {
            setUser(user.data)
          }
          setFetchingAccountData(false)
          enqueueSnackbar(t('common:login.success'), { variant: 'success' })
        })
        .catch((err) => {
          if (!err) {
            return
          }
          setFetchingAccountData(false)
          removeSession()
          enqueueErrorSnackbar(err, t('common:login.sessionExpired'))
        })
    }
  }, [cancellable, enqueueErrorSnackbar, enqueueSnackbar, removeSession, t])

  useEffect(() => {
    api.interceptors.response.use(undefined, (error: AxiosError) => {
      const isUnauthorized =
        !!error.response && [401, 403].includes(error.response.status)

      if (isUnauthorized) {
        enqueueErrorSnackbar(error, t('error:requestUnauthorized'))
        removeSession()
      }

      return Promise.reject(error.response || error.message)
    })
  }, [enqueueErrorSnackbar, removeSession, t])

  const authValue = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      setSession,
      logout: removeSession,
      updateUserData: (data) => {
        if (!user) {
          return
        }
        setUser({ ...user, ...data })
      },
    }),
    [login, removeSession, setSession, user],
  )

  return (
    <AuthContext.Provider value={authValue}>
      {children}
      <Backdrop
        sx={{
          color: (theme) => theme.palette.text.primary,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={fetchingAccountData && !user}
      >
        <Stack alignItems="center" spacing={4}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {t('common:login.fetchingAccountData')}
          </Typography>
          <CircularProgress color="inherit" />
        </Stack>
      </Backdrop>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
