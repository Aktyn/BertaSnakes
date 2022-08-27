import { useMemo, useState } from 'react'
import { VisibilityOff, Visibility } from '@mui/icons-material'
import type { OutlinedInputProps, TextFieldProps } from '@mui/material'
import {
  Fade,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { smoothBezier } from '../../../utils/common'

interface FormInputProps<FieldsType, TContext = unknown>
  extends Omit<
    TextFieldProps,
    'required' | 'inputProps' | 'InputProps' | 'label' | 'name'
  > {
  control: Control<FieldsType, TContext>
  name: Path<FieldsType>
  label?: string
  inputProps?: Partial<OutlinedInputProps>
  required?: boolean
  loading?: boolean
  allowPasswordPreview?: boolean
}

export const FormInput = <FieldsType extends FieldValues>({
  control,
  name,
  label,
  inputProps: initialInputProps,
  required,
  loading,
  allowPasswordPreview,
  ...textFieldProps
}: FormInputProps<FieldsType>) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputProps = useMemo(() => {
    if (loading) {
      return {
        ...initialInputProps,
        endAdornment: (
          <InputAdornment position="end">
            <Fade
              in
              appear
              easing={smoothBezier}
              style={{ transitionDelay: '200ms' }}
            >
              <CircularProgress size={24} color="inherit" />
            </Fade>
          </InputAdornment>
        ),
      }
    }
    if (textFieldProps.type !== 'password' || !allowPasswordPreview) {
      return initialInputProps
    }
    return {
      ...initialInputProps,
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => setShowPassword((show) => !show)}
            edge="end"
            color="inherit"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    }
  }, [
    allowPasswordPreview,
    initialInputProps,
    loading,
    showPassword,
    textFieldProps.type,
  ])

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, onBlur, value, name },
        fieldState: { error },
      }) => (
        <TextField
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          value={value ?? ''}
          variant="outlined"
          error={!!error}
          helperText={error?.message}
          label={label}
          required={required}
          InputProps={inputProps}
          {...textFieldProps}
          type={showPassword ? 'text' : textFieldProps.type}
        />
      )}
    />
  )
}
