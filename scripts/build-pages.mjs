import {mkdir,rm,copyFile,readdir} from 'node:fs/promises';import {resolve,join} from 'node:path';
const src=resolve('public'),dist=resolve('dist');const allow=['index.html','app.js','engine.js','session.js','sample.js','style.css','sarvam-assistance.js','sarvam-assistance.css','_headers','_routes.json'];
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});for(const file of allow)await copyFile(join(src,file),join(dist,file));
const items=(await readdir(dist)).sort();if(items.join()!==[...allow].sort().join())throw new Error('Unexpected public file');console.log(JSON.stringify({status:'PASS',assets:items},null,2));
