import { Config } from 'berta-snakes-shared'
import Joi from 'joi'
import i18n from '../../../i18n'
import { emailSchema } from '../../../validation/emailSchema'
import { passwordSchema } from '../../../validation/passwordSchema'

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .message(i18n.t('validation:username.minLength', { min: 3 }))
    .max(Config.MAX_USER_NAME_LENGTH)
    .message(
      i18n.t('validation:username.maxLength', {
        max: Config.MAX_USER_NAME_LENGTH,
      }),
    )
    .messages({ 'string.empty': i18n.t('validation:username.required') }),
  email: emailSchema,
  password: passwordSchema,

  confirmPassword: Joi.any()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': i18n.t('validation:password.doesNotMatch'),
    }),
}).with('password', 'confirmPassword')
