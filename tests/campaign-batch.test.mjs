import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCampaignBatch } from '../src/lib/campaignBatch.js';
import { lisbonDateToISO } from '../src/lib/tableEmails.js';
const people = [{name:'Maria',email:'m@example.com',table:'9'},{name:'Tiago',email:'M@example.com',table:'9'}];
test('one individual message per normalized email, no provider scheduling',()=>{
 const batch=buildCampaignBatch([{id:1,people}],'table_assignment','F <f@example.com>','r@example.com');
 assert.equal(batch.length,1); assert.deepEqual(batch[0].to,['m@example.com']);
 assert.match(batch[0].text,/Maria e Tiago/); assert.equal('scheduled_at' in batch[0],false);
 assert.equal('cc' in batch[0],false); assert.equal('bcc' in batch[0],false);
});
test('missing tables block table campaign but allow reminder',()=>{
 const rows=[{id:1,people:[{...people[0],table:''}]}];
 assert.throws(()=>buildCampaignBatch(rows,'table_assignment','f','r'));
 assert.equal(buildCampaignBatch(rows,'wedding_reminder','f','r').length,1);
});
test('invalid address and over 100 recipients block entire batch',()=>{
 assert.throws(()=>buildCampaignBatch([{id:1,people:[{...people[0],email:'bad'}]}],'wedding_reminder','f','r'));
 assert.throws(()=>buildCampaignBatch([{id:1,people:Array.from({length:101},(_,i)=>({...people[0],email:`a${i}@example.com`}))}],'wedding_reminder','f','r'));
});
test('authorized Lisbon schedules convert to correct UTC times',()=>{
 assert.equal(lisbonDateToISO('2026-09-19T19:04'),'2026-09-19T18:04:00.000Z');
 assert.equal(lisbonDateToISO('2026-09-26T14:30'),'2026-09-26T13:30:00.000Z');
});
