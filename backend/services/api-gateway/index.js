const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.API_GATEWAY_PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || "http://localhost:4002";
const lendingServiceUrl = process.env.LENDING_SERVICE_URL || "http://localhost:4003";
const openApiFilePath = path.join(__dirname, "../../docs/openapi.yaml");
const openApiBase = yaml.load(fs.readFileSync(openApiFilePath, "utf8"));

app.use(cors({ origin: corsOrigin }));

const buildOpenApiSpec = (req) => {
  const spec = JSON.parse(JSON.stringify(openApiBase));
  spec.servers = [
    {
      url: `${req.protocol}://${req.get("host")}`,
      description: "Current API gateway origin",
    },
  ];
  return spec;
};

const proxyOptions = (target, rewriteRule) => ({
  target,
  changeOrigin: true,
  pathRewrite: rewriteRule,
  proxyTimeout: 10_000,
  onError: (_err, _req, res) => {
    res.status(502).json({ message: "Upstream service unavailable." });
  },
});

app.get("/health", (_req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
    targets: {
      authServiceUrl,
      inventoryServiceUrl,
      lendingServiceUrl,
    },
  });
});

app.get("/api-docs.json", (req, res) => {
  res.json(buildOpenApiSpec(req));
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  (req, _res, next) => {
    req.swaggerDoc = buildOpenApiSpec(req);
    next();
  },
  swaggerUi.setup(undefined, { explorer: true })
);

app.use(
  "/api/auth",
  createProxyMiddleware(
    proxyOptions(authServiceUrl, (path) => `/auth${path === "/" ? "" : path}`)
  )
);
app.use(
  "/api/equipment",
  createProxyMiddleware(
    proxyOptions(inventoryServiceUrl, (path) => `/equipment${path === "/" ? "" : path}`)
  )
);
app.use(
  "/api/requests",
  createProxyMiddleware(
    proxyOptions(lendingServiceUrl, (path) => `/requests${path === "/" ? "" : path}`)
  )
);

app.listen(port, () => {
  console.log(`API gateway running on http://localhost:${port}`);
});
