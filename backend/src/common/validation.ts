import { type ValidationOptions, ValidateIf } from 'class-validator'

export function IsNullable(validationOptions?: ValidationOptions) {
  return ValidateIf((_, value) => value !== null, validationOptions)
}
