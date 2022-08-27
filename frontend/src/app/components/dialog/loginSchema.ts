import Joi from 'joi'
import i18n from '../../../i18n'
import { emailSchema } from '../../../validation/emailSchema'
import { passwordSchema } from '../../../validation/passwordSchema'

export const loginSchema = Joi.object({
  login: Joi.string()
    .min(3)
    .message(i18n.t('validation:username.minLength', { min: 3 }))
    .messages({ 'string.empty': i18n.t('validation:username.required') }),
  email: emailSchema,
  password: passwordSchema,
})
