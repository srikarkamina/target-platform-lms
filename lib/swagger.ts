import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Target Platform LMS API",
      version: "1.0.0",
      description: "LMS Backend APIs",
    },
  },
  apis: ["app/api/**/route.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);