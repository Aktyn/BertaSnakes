import type { OutlinedInputProps, TextFieldProps } from '@mui/material'
import { TextField } from '@mui/material'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'

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
}

export const FormInput = <FieldsType extends FieldValues>({
  control,
  name,
  label,
  inputProps,
  required,
  ...textFieldProps
}: FormInputProps<FieldsType>) => {
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
        />
      )}
    />
  )
}
