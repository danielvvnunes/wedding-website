import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/admin-gallery.js';
test('gallery moderation rejects public credentials and resolves deletion paths on server', async t => {
 const env={GALLERY_ADMIN_PASSWORD:'private-test',SUPABASE_SERVICE_ROLE_KEY:'service-test',SUPABASE_URL:'https://db.example.test'};
 const previous=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]])); Object.assign(process.env,env);
 const original=globalThis.fetch; const calls=[]; let failStorage=false; let carousel=false;
 t.after(()=>{globalThis.fetch=original;for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
 globalThis.fetch=async (input,init)=>{
  const r=new Request(input,init),u=new URL(r.url);assert.equal(u.host,'db.example.test');
  const body=await r.json().catch(()=>null);calls.push({method:r.method,path:u.pathname,body,search:u.search});
  if(u.pathname.includes('/storage/'))return new Response(JSON.stringify(failStorage?{message:'failed'}:[]),{status:failStorage?500:200,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify(r.method==='GET'?{id:'test-id',file_path:'guest/original.jpg',file_type:'image/jpeg',media:carousel?[{file_path:'guest/original.jpg',file_type:'image/jpeg'},{file_path:'guest/second/original.jpg',file_type:'image/jpeg'}]:null}:null),{headers:{'Content-Type':'application/json'}});
 };
 async function call(password,body){const res={statusCode:200,setHeader(){},status(v){this.statusCode=v;return this},json(d){this.data=d;return this}};await handler({method:'POST',headers:{'x-gallery-password':password},body},res);return res;}
 assert.equal((await call('wrong',{action:'delete',id:'test-id'})).statusCode,401);assert.equal(calls.length,0);
 assert.equal((await call('private-test',{action:'delete',id:'../bad'})).statusCode,400);assert.equal(calls.length,0);
 const result=await call('private-test',{action:'delete',id:'test-id',file_path:'another-person.jpg'});
 assert.equal(result.statusCode,200);
 const storage=calls.find(c=>c.path.includes('/storage/'));
 assert.deepEqual(storage.body.prefixes,['guest/original.jpg','guest/feed.jpg','guest/thumb.jpg','guest/feed.webp','guest/thumb.webp']);
 assert.equal(calls.filter(c=>c.method==='DELETE'&&c.path.startsWith('/rest/')).length,3);
 calls.length=0;carousel=true;
 assert.equal((await call('private-test',{action:'delete',id:'test-id'})).statusCode,200);
 assert.equal(calls.find(c=>c.path.includes('/storage/')).body.prefixes.length,10);
 assert.ok(calls.find(c=>c.path.includes('/storage/')).body.prefixes.includes('guest/second/original.jpg'));
 calls.length=0;failStorage=true;
 assert.equal((await call('private-test',{action:'delete',id:'test-id'})).statusCode,500);
 assert.equal(calls.filter(c=>c.path.startsWith('/rest/')&&c.method==='DELETE').length,0);
});
