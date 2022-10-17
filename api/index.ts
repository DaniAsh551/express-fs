import express, {json,urlencoded} from "express";
import { IRoute } from "./constants";
import cors from "cors";
import fileRoutes from "./modules/file";

const app = express();

const extractRoutes = (routesCollection:any) => Object.keys(routesCollection).map(k => routesCollection[k] as IRoute);

const routes:IRoute[] = [
  ...fileRoutes
];

if(!process.env.STRICT_CORS) {
  const CORS = {
    origin: '*', // for development-only
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  app.use(cors(CORS));
}

app.use(express.raw({ type: "application/octet-stream", limit: "1gb" }))
app.use(json({ type: "application/json" }));
app.use(urlencoded());

(app["get"] as Function)("/api/status", (req,res) => res.status(200).send("APP RUNNING"));
// console.log("routes", routes);

const registerRoute = (route:IRoute) => (app[route.method ?? "all"] as Function)(`/api${route.path}`, route.handler);

//register all routes
routes?.forEach(route => {
  try{
    registerRoute(route)
  }catch(e){
    console.error('error registering route', route);
  }
});

export const viteNodeApp = app;