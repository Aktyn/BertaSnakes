import Joi from 'joi'
import i18n from '../i18n'

export const passwordSchema = Joi.string()
  .min(8)
  .message(i18n.t('validation:password.minLength.8'))
  .pattern(/\d/)
  .message(i18n.t('validation:password.mustContainDigit'))
  .pattern(/[a-z]/)
  .message(i18n.t('validation:password.mustContainLowercaseLetter'))
  .pattern(/[A-Z]/)
  .message(i18n.t('validation:password.mustContainUppercaseLetter'))
  .pattern(/[#?!@$%^&*-]/)
  .message(i18n.t('validation:password.mustContainSpecialSymbol'))
  .messages({ 'string.empty': i18n.t('validation:password.required') })
