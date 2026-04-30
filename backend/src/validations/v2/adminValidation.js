import Joi from "joi";

export const suspendUserSchema = Joi.object({
  isActive: Joi.boolean().required()
});
