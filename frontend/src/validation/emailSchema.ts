import Joi from 'joi'
import i18n from '../i18n'

export const emailSchema = Joi.string()
  .email({
    tlds: { allow: false },
    minDomainSegments: 2,
  })
  .messages({
    'string.email': i18n.t('validation:email.mustBeValid'),
    'string.empty': i18n.t('validation:email.required'),
  })
