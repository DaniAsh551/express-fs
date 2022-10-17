import fs from "fs";

export interface IFileMetadata {
  type: string,
  name: string,
  stat: fs.Stats
}

export class FileMetadata implements IFileMetadata {
  constructor(type:string, name:string, stat:fs.Stats){
    this.type = type;
    this.name = name;
    this.stat = stat;
  }

  type: string;
  name: string;
  stat: fs.Stats;
}