export const TRANSFER_KEYS=['tm_local','tm_who','tm_cloud_v1','sb-zrblwvuhzhvljkmhtvgg-auth-token'];
export function validateTransfer(pack){
 if(!pack||pack.version!==1||!Array.isArray(pack.photos)||!pack.storage||typeof pack.storage!=='object')throw new Error('Die Sicherung ist unvollständig oder hat ein anderes Format.');
 for(const [key,value] of Object.entries(pack.storage))if(!TRANSFER_KEYS.includes(key)||typeof value!=='string')throw new Error('Die Sicherung enthält unbekannte Daten.');
 for(const item of pack.photos)if(!Array.isArray(item)||item.length!==2||typeof item[0]!=='string'||!item[0].startsWith('local:'))throw new Error('Die Fotosicherung ist beschädigt.');
 return pack;
}
export async function adoptTransfer(pack){
 validateTransfer(pack);
 if(localStorage.getItem('tm_cloud_v1')||localStorage.getItem('tm_local'))throw new Error('Hier sind bereits Teller-Match-Daten vorhanden. Die Übernahme überschreibt keine bestehende Verbindung.');
 const photos=pack.photos.map(([id,value])=>{
  if(value instanceof Blob)return[id,value];
  if(typeof value!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(value))throw new Error('Ein Foto in der Sicherung ist ungültig.');
  const [head,base64]=value.split(',');const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
  return[id,new Blob([bytes],{type:head.slice(5,head.indexOf(';'))})];
 });
 const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('teller-match-photos',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');for(const[id,blob]of photos)tx.objectStore('photos').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(new Error('Fotos konnten nicht gespeichert werden.'));});}finally{db.close();}
 // Store a recovery copy before activating the transferred login. Never clear old backups.
 localStorage.setItem('tm_transfer_backup_v1',JSON.stringify({date:new Date().toISOString(),storage:pack.storage}));
 for(const [key,value]of Object.entries(pack.storage))localStorage.setItem(key,value);
}
