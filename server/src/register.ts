import type { Core } from "@strapi/strapi";
import { ACTIONS } from "./constants";

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi.service("admin::permission").actionProvider.registerMany(ACTIONS);
};

export default register;