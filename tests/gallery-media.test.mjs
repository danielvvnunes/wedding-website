import test from 'node:test';
import assert from 'node:assert/strict';
import {flattenGalleryMedia} from '../src/lib/galleryMedia.js';
test('wall and exports include ordered carousel files and preserve legacy posts',()=>{
 const legacy={id:1,file_url:'old.jpg',uploaded_by:'Ana'};
 const carousel={id:2,uploaded_by:'João',caption:'Dia feliz',media:[{file_url:'one.jpg'},{file_url:'two.jpg'}]};
 const files=flattenGalleryMedia([legacy,carousel]);
 assert.deepEqual(files.map(f=>f.file_url),['old.jpg','one.jpg','two.jpg']);
 assert.equal(files[2].uploaded_by,'João');assert.equal(files[2].caption,'Dia feliz');assert.equal(carousel.media.length,2);
});
