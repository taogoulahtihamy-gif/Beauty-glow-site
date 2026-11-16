import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const directory=path.resolve('dist');
const pages=['index','notre-univers','prestations','inspirations','reservation','contact','credits'];
const titles=new Set();
for(const page of pages){
 const html=fs.readFileSync(path.join(directory,`${page}.html`),'utf8');
 assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,`${page}: one H1`);
 const title=html.match(/<title>(.*?)<\/title>/s)[1];assert.ok(!titles.has(title));titles.add(title);
 assert.ok(!/MagiShop|Beauty Glow|MagicShop and beauty/i.test(html),`${page}: obsolete brand`);
 assert.ok(html.includes('Ets. Ndob_MagicShop'));
 assert.equal((html.match(/aria-current="page"/g)||[]).length,page==='credits'?0:1,`${page}: active navigation`);
 for(const [,attribute,raw] of html.matchAll(/\b(href|src)="([^"]+)"/g)){
  const value=raw.replaceAll('&amp;','&');
  if(/^(https?:|tel:|data:)/.test(value))continue;
  const url=new URL(value,`https://example.test/${page}.html`);
  const target=path.join(directory,decodeURIComponent(url.pathname));
  assert.ok(fs.existsSync(target),`${page}: missing ${attribute} ${value}`);
  if(url.hash&&target.endsWith('.html')){
   const linked=fs.readFileSync(target,'utf8');assert.ok(linked.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${page}: missing fragment ${value}`);
  }
 }
 assert.ok(!html.includes('{{'),`${page}: unresolved template`);
}
const home=fs.readFileSync(path.join(directory,'index.html'),'utf8');
assert.ok(home.includes('images/editorial/hero-original.webp'));
assert.ok(!home.includes('id="bookingForm"'));
assert.equal((fs.readFileSync(path.join(directory,'prestations.html'),'utf8').match(/class="catalogue-row"/g)||[]).length,6);
const services=JSON.parse(fs.readFileSync('src/data/services.json','utf8'));
for(const [id,price] of Object.entries({coiffure:'10 000',tresses:'15 000',maquillage:'20 000',manucure:'5 000'}))assert.equal(services.find(s=>s.id===id).price,price);
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));assert.equal(vercel.outputDirectory,'dist');assert.equal(vercel.buildCommand,'npm run build');assert.equal(vercel.framework,null);
console.log('7 static pages: unique SEO titles, local links/assets, brand, prices, components and Vercel output OK.');
