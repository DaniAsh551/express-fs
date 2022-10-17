import express, { RequestHandler } from "express";
import fs from "fs";

export const STORAGE_PATH:string = process.env.STORAGE_PATH ?? "/tmp/storage";
if(!STORAGE_PATH) throw "STORAGE_PATH must be set in the environment";

if(!fs.existsSync(STORAGE_PATH)) fs.mkdirSync(STORAGE_PATH, { recursive: true });

export interface IRoute {
  parent?:string,
  method?: string,
  path:string,
  handler: RequestHandler
}