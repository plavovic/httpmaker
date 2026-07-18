import type { UploadedImageAsset } from "@/types/uploadedAsset";
import type { WebsiteJSON } from "@/types/website";

const ASSET_SCHEME = "asset://";
export const createAssetReference = (id: string) => `${ASSET_SCHEME}${id}`;

function mapWebsiteImages(website: WebsiteJSON, mapSource: (source: string) => string): WebsiteJSON {
 return {...website,theme:{...website.theme,backgroundImageUrl:website.theme.backgroundImageUrl?mapSource(website.theme.backgroundImageUrl):undefined},sections:website.sections.map(section=>({...section,backgroundImageUrl:section.backgroundImageUrl?mapSource(section.backgroundImageUrl):undefined,props:{...section.props,imageUrl:mapSource(section.props.imageUrl),items:section.props.items?.map(mapSource)}}))};
}

export function compactWebsiteAssetReferences(website: WebsiteJSON, assets: UploadedImageAsset[]): WebsiteJSON {
 const references=new Map(assets.map(asset=>[asset.dataUrl,createAssetReference(asset.id)]));
 return mapWebsiteImages(website,source=>references.get(source)??source);
}

export function resolveWebsiteAssetReferences(website: WebsiteJSON, assets: UploadedImageAsset[]): WebsiteJSON {
 const sources=new Map(assets.map(asset=>[createAssetReference(asset.id),asset.dataUrl]));
 return mapWebsiteImages(website,source=>sources.get(source)??source);
}

const DB_NAME = "httpmaker-assets"; const STORE = "images"; const VERSION = 1;
const openDatabase = () => new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB_NAME,VERSION);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:"id"})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
const transaction = async <T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,resolve:(value:T)=>void,reject:(reason:unknown)=>void)=>void)=>{const db=await openDatabase();return new Promise<T>((resolve,reject)=>{const tx=db.transaction(STORE,mode);run(tx.objectStore(STORE),resolve,reject);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error)})};
export const listImageAssets=(ownerId:string)=>transaction<UploadedImageAsset[]>("readonly",(store,resolve,reject)=>{const request=store.getAll();request.onsuccess=()=>resolve((request.result as UploadedImageAsset[]).filter(asset=>asset.ownerId===ownerId).sort((a,b)=>b.createdAt-a.createdAt));request.onerror=()=>reject(request.error)});
export const saveImageAsset=(asset:UploadedImageAsset,ownerId:string)=>{if(asset.ownerId!==ownerId)return Promise.reject(new Error("Asset ownership does not match the current user."));return transaction<void>("readwrite",(store,resolve,reject)=>{const request=store.put(asset);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error)})};
export const deleteImageAsset=(id:string,ownerId:string)=>transaction<void>("readwrite",(store,resolve,reject)=>{const lookup=store.get(id);lookup.onsuccess=()=>{const asset=lookup.result as UploadedImageAsset|undefined;if(!asset||asset.ownerId!==ownerId){resolve();return}const request=store.delete(id);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error)};lookup.onerror=()=>reject(lookup.error)});

const readDataUrl=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)});
const imageSize=(dataUrl:string)=>new Promise<{width:number;height:number}>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error("Unable to read image dimensions."));image.src=dataUrl});
export async function createImageAsset(file:File,ownerId:string):Promise<UploadedImageAsset>{
 if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type))throw new Error(`${file.name} is not a supported image.`);
 if(file.size>10*1024*1024)throw new Error(`${file.name} exceeds the 10 MB limit.`);
 const dataUrl=await readDataUrl(file);const dimensions=await imageSize(dataUrl);
 return{id:crypto.randomUUID(),ownerId,name:file.name,mimeType:file.type,size:file.size,...dimensions,dataUrl,createdAt:Date.now()};
}
