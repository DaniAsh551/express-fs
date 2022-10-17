import { IRoute } from "../constants";
import { RequestHandler } from "express";
import { ApiResponse } from "../common/IApiResponse";
import { STORAGE_PATH } from "../constants";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { FileMetadata, IFileMetadata } from "../../common/IFile";
import { exec } from "child_process";

export interface IHandledFile {
  type: string,
  name: string
}

const fullPath:(...args:string[]) => string = function(...args){
  args = [STORAGE_PATH, ...args];
  return path.join.call(null, ...args);
}

const ensureDir = async function(type:string) {
  const fpath = fullPath(type);
  if(!fsSync.existsSync(fpath)) await fs.mkdir(fpath, { recursive: true });
}

const getMime = function(filePath:string) {
  const promise = new Promise<string>((res,rej) => {
    exec(`file --mime-type -L "${filePath}"`, (e,sout,ser) => {
      try {
        res(sout.split(" ")[1].replace("\n", ""))
      } catch (error) {
        res("application/octet-stream");
      }
    });
  });
  return promise;
}

const read:RequestHandler = async function(req, res) {

  const type = req.query.type as string;
  const name = req.query.name as string;
  if(!type || !name) return res.status(400).json(ApiResponse.fail(null, 400, "Need type and name"));

  console.log({ range:req.headers.range });
  let range = req.headers.range ? req.headers.range.split("-").
    map(x => x.split('').filter(i => "0123456789".includes('' + i)).join('')).map(x => parseInt(x)) :
    null;

  const fpath = fullPath(type, name);
  await ensureDir(type);
  
  if(!fsSync.existsSync(fpath)) return res.status(404).json(ApiResponse.fail(null, 404, "Not Found"));
  
  const stat = await fs.stat(fpath);
  console.log(stat);
  if(range && Math.max(range[0], range[1]) > stat.size) range = null;
  else if(range && (range.length == 1 || isNaN(range[1]))) range = [range[0], stat.size];

  console.log({ range });

  const mime = await getMime(fpath);

  const handle = await fs.open(fpath, "r");
  res.writeHead(range ? 206 : 200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Accept-Ranges': "bytes",
    'Range': range ? range.join('-') : `bytes=0-${stat.size}`,
    'Content-Disposition': `attachment; filename=${name}`
  });

  const readOptions = range ? { start: range[0], end: range[1] } : undefined;
  const stream = handle.createReadStream(readOptions);
  stream.pipe(res);

  const destroy = () => {
    res.end();
    stream.close();
    handle.close();
  };

  stream.on("end", destroy);
  stream.on("close", destroy);
}

export const create:RequestHandler = async function(req,res) {
  const type = req.query.type as string;
  const name = req.query.name as string;
  if(!type || !name) return res.status(400).json(ApiResponse.fail(null, 400, "Need type and name"));
  const fpath = fullPath(type, name);
  await ensureDir(type);

  if(fsSync.existsSync(fpath)) return res.json(ApiResponse.fail(null, 1, "File Exists"));

  const handle = await fs.open(fpath, "w+");
  const stream =  handle.createWriteStream({ autoClose: false });
  stream.write(req.body, async (error) => {
    if(error) console.error(error);
    stream.close();
    handle.close();
  });

  res.json(ApiResponse.success(true));
}

export const stat:RequestHandler = async function(req, res) {
  const type = req.query.type as string;
  const name = req.query.name as string;
  if(!type || !name) return res.status(400).json(ApiResponse.fail(null, 400, "Need type and name"));
  const fpath = fullPath(type, name);
  await ensureDir(type);

  if(!fsSync.existsSync(fpath)) return res.json(ApiResponse.fail(null, 404, "File Does Not Exist"));

  const stat = await fs.stat(fpath);
  res.json(ApiResponse.success(new FileMetadata(type, name, stat)));
}

export const remove:RequestHandler = async function(req, res) {
  const type = req.query.type as string;
  const name = req.query.name as string;
  if(!type || !name) return res.status(400).json(ApiResponse.fail(null, 400, "Need type and name"));
  const fpath = fullPath(type, name);
  await ensureDir(type);

  if(!fsSync.existsSync(fpath)) return res.json(ApiResponse.success(true));

  await fs.unlink(fullPath(type, name));
  res.json(ApiResponse.success(true));
}

export const list:RequestHandler = async function(req, res) {
  const type = (req.query.type ?? "") as string;
  if(!type) return res.status(400).json(ApiResponse.fail(null, 400, "Need type"));
  const fpath = fullPath(type);
  await ensureDir(type);

  const entries = await fs.readdir(fpath, { withFileTypes:true, encoding: "utf8" });
  const list = entries.map(e => ({
    name: e.name,
    isFile: e.isFile()
  }));

  res.json(ApiResponse.success(list));
}

const routes:IRoute[] = [
  {
    handler:create,
    path: "/files/create",
    method: "post"
  },
  {
    handler:stat,
    path: "/files/stat",
    method: "get"
  },
  {
    handler:remove,
    path: "/files/remove",
    method: "delete"
  },
  {
    handler:read,
    path: "/files/read",
    method: "get"
  },
  {
    handler:list,
    path: "/files/list",
    method: "get"
  },
];

export default routes;