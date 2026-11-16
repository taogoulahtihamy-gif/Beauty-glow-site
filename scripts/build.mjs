import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(path.join(root, file), 'utf8');
const partial = name => read(`src/partials/${name}.html`);
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const gallery = JSON.parse(await read('src/data/gallery.json'));
const services = JSON.parse(await read('src/data/services.json'));
const pages = [
  { id:'index', label:'Accueil', title:'Coiffure & beauté à N’Djamena', description:'MagicShop and beauty à Chagoua : coiffures africaines, tresses, soins, maquillage et manucure. Découvrez votre prochain moment beauté.', image:'hero-original' },
  { id:'notre-univers', label:'Notre univers', title:'Notre univers, la beauté africaine singulière', description:'Entrez dans l’univers MagicShop and beauty : racines africaines, textures naturelles et styles qui vous ressemblent, à N’Djamena.', image:'braids' },
  { id:'prestations', label:'Prestations & tarifs', title:'Prestations & tarifs', description:'Coiffure dès 10 000 FCFA, tresses dès 15 000 FCFA, maquillage dès 20 000 FCFA, manucure et pédicure dès 5 000 FCFA. Découvrez nos prestations.', image:'sculptural' },
  { id:'inspirations', label:'Inspirations', title:'Inspirations, coiffures africaines & textures', description:'Explorez 11 photographies d’inspiration : braids, nattes collées, vanilles, locs et cheveux afro. Choisissez un style pour votre réservation.', image:'locs' },
  { id:'reservation', label:'Réserver un moment', title:'Demander un rendez-vous', description:'Préparez votre demande de rendez-vous chez MagicShop and beauty sur WhatsApp au +235 61 48 85 44. Date, prestation et inspiration au choix.', image:'signature' },
  { id:'contact', label:'Nous trouver', title:'Nous trouver à Chagoua, N’Djamena', description:'MagicShop and beauty : Chagoua, avenue Mathias Ngartery, axe CA7, N’Djamena, Tchad. Téléphone et WhatsApp : +235 61 48 85 44.', image:'hero-original' },
  { id:'credits', label:'Crédits', title:'Crédits photos & informations', description:'Sources et licences des photographies d’inspiration et des typographies utilisées par MagicShop and beauty.', image:'hero-original' }
];
const navOrder = ['index','notre-univers','prestations','inspirations','contact','reservation'];
function galleryItem(photo, preview = false) {
  const href = preview ? `inspirations.html?photo=${encodeURIComponent(photo.id)}` : photo.image;
  return `<a class="gallery-item${preview ? ' gallery-preview' : ''}" href="${href}" data-category="${photo.category}" data-id="${photo.id}" data-title="${escape(photo.title)}" data-image="${photo.image}" aria-label="${preview ? 'Découvrir' : 'Agrandir'} : ${escape(photo.title)}"><span class="gallery-photo"><img src="${photo.image.replace('.webp','-640.webp')}" alt="${escape(photo.alt)}" width="640" height="800" loading="lazy" decoding="async"><span class="photo-expand" aria-hidden="true">↗</span></span><span class="gallery-caption"><strong>${escape(photo.title)}</strong><span>${escape(photo.caption)}</span></span></a>`;
}
function serviceRow(service, index) {
  const price = service.price ? `<small>À PARTIR DE</small><strong>${service.price} <span>FCFA</span></strong>` : '<small>SELON VOTRE ENVIE</small><strong class="price-request">Tarif sur demande</strong>';
  return `<article class="catalogue-row" id="${service.id}" data-reveal><div class="catalogue-image"><img src="images/editorial/${service.image}-640.webp" alt="${escape(service.alt)}" width="640" height="800" loading="lazy"><span>0${index+1}</span></div><div class="catalogue-description"><p class="eyebrow">${service.eyebrow}</p><h2>${escape(service.name)}</h2><p>${escape(service.description)}</p></div><div class="catalogue-action"><div class="catalogue-price">${price}</div><a class="btn" href="reservation.html?service=${encodeURIComponent(service.service)}" aria-label="Réserver : ${escape(service.name)}">Réserver <span aria-hidden="true">↗</span></a></div></article>`;
}
const [layout, header, footer, cta, bookingForm, dialog] = await Promise.all(['layout','header','footer','cta','booking-form','gallery-dialog'].map(partial));
await mkdir(path.join(root,'dist'), { recursive:true });
for (const page of pages) {
  const navigation = navOrder.map(id => {
    const item = pages.find(p=>p.id===id);
    return `<a href="${id}.html"${id===page.id ? ' aria-current="page"' : ''}${id==='reservation' ? ' class="btn btn-small"' : ''}>${escape(item.label)}${id==='reservation' ? '<span aria-hidden="true">↗</span>' : ''}</a>`;
  }).join('\n');
  let content = await read(`src/pages/${page.id}.html`);
  const pieces = { cta, bookingForm, gallery:gallery.map(p=>galleryItem(p)).join('\n'), homeGallery:['cornrows','afro','braids-portrait'].map(id=>galleryItem(gallery.find(p=>p.id===id),true)).join('\n'), serviceCatalogue:services.map(serviceRow).join('\n'), galleryJSON:JSON.stringify(gallery).replaceAll('<','\\u003c') };
  for (const [key,value] of Object.entries(pieces)) content=content.replaceAll(`{{${key}}}`,value);
  const fields = { id:page.id, title:escape(page.title), description:escape(page.description), ogImage:`images/editorial/${page.image}.webp`, header:header.replace('{{navigation}}',navigation), footer, content, dialog:page.id==='inspirations' ? dialog : '' };
  let html=layout;
  for (const [key,value] of Object.entries(fields)) html=html.replaceAll(`{{${key}}}`,value);
  if (/\{\{\w+\}\}/.test(html)) throw new Error(`Unresolved component in ${page.id}`);
  if (process.env.SITE_URL) {
    const site=new URL(process.env.SITE_URL);
    if (!['https:','http:'].includes(site.protocol)) throw new Error('SITE_URL must be HTTP(S)');
    const canonical=new URL(page.id==='index' ? './' : `${page.id}.html`,site).href;
    html=html.replace('</head>',`<link rel="canonical" href="${escape(canonical)}"></head>`).replace(`content="${fields.ogImage}"`,`content="${escape(new URL(fields.ogImage,site).href)}"`);
  }
  // Root HTML remains directly usable by a static server; dist is the deployment output.
  await writeFile(path.join(root,`${page.id}.html`),html);
  await writeFile(path.join(root,'dist',`${page.id}.html`),html);
}
for (const file of ['style.css','script.js','images/favicon.svg']) {
  await mkdir(path.dirname(path.join(root,'dist',file)),{recursive:true});
  await cp(path.join(root,file),path.join(root,'dist',file));
}
for (const directory of ['fonts','images/editorial']) await cp(path.join(root,directory),path.join(root,'dist',directory),{recursive:true});
console.log('Built 6 independent pages + photo credits → dist/');
