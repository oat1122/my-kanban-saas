import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

/**
 * Plugin to setup Zod validation for Fastify
 */
export default fp(async (fastify) => {
  // Add schema validator and serializer for Zod
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
});
