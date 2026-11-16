const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8088';
const out = path.resolve(__dirname, '../artifacts/v4');
const pages = ['index','notre-univers','prestations','inspirations','reservation','contact'];
const widths = [320,375,390,430,768,1024,1440];
fs.mkdirSync(out, {recursive:true});

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome', headless:true, args:['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce', locale:'fr-FR' });
    const page = await context.newPage();
    const errors = [], resources = [], checks = [], layoutFailures = [], violations = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if(response.url().startsWith(base) && response.status() >= 400) resources.push([response.status(),response.url()]); });
    for (const id of pages) {
      for (const width of widths) {
        await page.setViewportSize({width,height:width<700?844:1000});
        const response=await page.goto(`${base}/${id}.html`, {waitUntil:'domcontentloaded'});
        assert.equal(response.status(),200);
        await page.evaluate(async()=>{
          for(let y=0;y<document.body.scrollHeight;y+=650){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,35));}
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('img[src]')].every(img=>!img.getClientRects().length || img.complete), {timeout:15000});
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        const layout = await page.evaluate(()=>({
          overflow:document.documentElement.scrollWidth>innerWidth,
          broken:[...document.querySelectorAll('img[src]')].filter(i=>i.getClientRects().length && !i.naturalWidth).map(i=>i.getAttribute('src')),
          clipped:[...document.querySelectorAll('h1,h2,h3,p,label,.btn')].filter(e=>!e.closest(".sr-only") && e.clientWidth>0 && e.scrollWidth>e.clientWidth+2).map(e=>({tag:e.tagName,text:e.textContent.slice(0,65),width:e.clientWidth,scroll:e.scrollWidth})),
          active:document.querySelector('nav[aria-label="Navigation principale"] [aria-current="page"]')?.getAttribute('href')
        }));
        if(layout.overflow || layout.broken.length || layout.clipped.length) layoutFailures.push({page:id,width,...layout});
        assert.equal(layout.active,`${id}.html`);
        if([390,1440].includes(width)) {
          if(id==='contact') {
            await page.locator('iframe').scrollIntoViewIfNeeded();
            await page.waitForTimeout(6000);
            await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
          }
          const device=width===390?'mobile':'desktop';
          await page.screenshot({path:`${out}/${id}-${device}-hero.png`});
          if(id==='contact') {
            // Keep the cross-origin map painted during the full-page capture.
            const originalViewport=page.viewportSize();
            const height=await page.evaluate(()=>document.documentElement.scrollHeight);
            await page.setViewportSize({width,height});
            await page.waitForTimeout(1500);
            await page.screenshot({path:`${out}/${id}-${device}.png`,fullPage:true});
            await page.setViewportSize(originalViewport);
          } else await page.screenshot({path:`${out}/${id}-${device}.png`,fullPage:true});
          // The embedded third-party map is not part of our component audit.
          const audit=await new AxeBuilder({page}).exclude('iframe').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
          if(audit.violations.length)violations.push({page:id,width,violations:audit.violations});
        }
        if(width===1024)assert.equal(await page.locator('#navToggle').isVisible(),false);
      }
      console.log(`${id}: 7 viewports, screenshots and accessibility audited`);
    }
    fs.writeFileSync(`${out}/layout.json`,JSON.stringify(layoutFailures,null,2));
    fs.writeFileSync(`${out}/axe.json`,JSON.stringify(violations,null,2));
    checks.push('6 pages × 7 widths = 42 responsive combinations; desktop + mobile screenshots');
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`${base}/prestations.html`);
    const serviceLinks=await page.locator('.catalogue-action .btn').evaluateAll(links=>links.map(link=>link.href));
    for(const link of serviceLinks){
      await page.goto(link);const expected=new URL(link).searchParams.get('service');
      assert.equal(await page.locator('#serviceSelect').inputValue(),expected);
      await page.reload();assert.equal(await page.locator('#serviceSelect').inputValue(),expected);
    }
    checks.push('All 6 service links preselect the requested service and survive direct reload');
    await page.goto(`${base}/inspirations.html?categorie=nattes`);
    assert.equal(await page.locator('.gallery-item:visible').count(),2);
    for(const filter of ['all','braids','nattes','twists','locs','afro']){
      await page.locator(`[data-filter="${filter}"]`).click();
      assert.equal(await page.locator(`[data-filter="${filter}"]`).getAttribute('aria-pressed'),'true');
      assert.ok(await page.locator('.gallery-item:visible').count()>0);
      await page.locator('.gallery-item:visible').first().click();
      assert.equal(await page.locator('#galleryDialog').evaluate(el=>el.open),true);
      if(filter==='locs'||filter==='afro')assert.equal(await page.locator('#nextPhoto').isDisabled(),true);
      await page.keyboard.press('Escape');
    }
    await page.locator('[data-filter="all"]').click();
    await page.locator('.gallery-item').first().click();
    const first=await page.locator('#dialogCaption').textContent();
    await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#dialogCaption').textContent(),first);
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#dialogCaption').textContent(),first);
    for(let i=0;i<10;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('dialog')));}
    await page.keyboard.press('Escape');assert.ok(await page.locator('.gallery-item').first().evaluate(el=>el===document.activeElement));
    await page.goto(`${base}/inspirations.html?photo=braids-portrait`);
    assert.equal(await page.locator('#dialogCaption').textContent(),'Twists en douceur');
    await page.locator('#chooseInspiration').click();
    await page.waitForURL('**/reservation.html?inspiration=braids-portrait');
    assert.equal(await page.locator('#chosenTitle').textContent(),'Twists en douceur');
    assert.equal(await page.locator('#serviceSelect').inputValue(),'Vanilles & twists');
    await page.reload();assert.equal(await page.locator('#chosenInspiration').isVisible(),true);
    await page.locator('#clearInspiration').click();assert.equal(await page.locator('#chosenInspiration').isVisible(),false);assert.ok(!page.url().includes('inspiration='));
    checks.push('All gallery filters, deep links, modal keyboard/focus, inspiration transfer and removal');
    await page.goto(`${base}/reservation.html?inspiration=cornrows`);
    await page.evaluate(()=>{window.__opened=[];window.open=(...args)=>{window.__opened.push(args);return null;};});
    await page.locator('.submit-btn').click();assert.equal(await page.evaluate(()=>window.__opened.length),0);
    await page.locator('#clientName').fill('   ');await page.locator('#clientPhone').fill('abcdefgh');
    const future=await page.evaluate(()=>{const date=new Date();date.setDate(date.getDate()+5);return date.toISOString().slice(0,10);});
    await page.locator('#preferredDate').fill(future);await page.locator('.submit-btn').click();assert.equal(await page.evaluate(()=>window.__opened.length),0);
    await page.locator('#clientName').fill('Aïcha & Mariam');await page.locator('#clientPhone').fill('+235 61 48 85 44');
    await page.locator('#preferredDate').fill('2020-01-01');await page.locator('.submit-btn').click();assert.equal(await page.evaluate(()=>window.__opened.length),0);
    await page.locator('#preferredDate').fill(future);await page.locator('#preferredTime').fill('14:30');await page.locator('#clientMessage').fill('Longueur épaules, merci !');
    await page.locator('.submit-btn').click();const opened=await page.evaluate(()=>window.__opened);assert.equal(opened.length,1);
    const url=new URL(opened[0][0]);assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/23561488544');
    for(const text of ['Bonjour Ets. Ndob_MagicShop','Aïcha & Mariam','Tresses','Nattes collées','14:30','Longueur épaules'])assert.ok(url.searchParams.get('text').includes(text));
    assert.equal(await page.locator('#whatsappContinue').getAttribute('href'),url.href);assert.equal(await page.locator('#bookingResult').isVisible(),true);
    await page.locator('#clientName').fill('Aïcha');assert.equal(await page.locator('#bookingResult').isVisible(),false);
    await page.locator('#preferredTime').fill('');await page.locator('#clientMessage').fill('');await page.locator('.submit-btn').click();
    assert.ok((await page.locator('#whatsappContinue').getAttribute('href')).includes(encodeURIComponent('À convenir')));
    checks.push('WhatsApp: name, phone, past dates, accents, chosen inspiration, optional fields, exact recipient and one opening; no message sent');
    await page.setViewportSize({width:390,height:844});
    for(const id of pages){
      await page.goto(`${base}/${id}.html`);
      assert.equal(await page.locator('#navLinks').evaluate(e=>e.inert),true);
      await page.locator('#navToggle').click();assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'true');
      assert.equal(await page.locator('#navLinks').evaluate(e=>e.inert),false);
      await page.keyboard.press('Escape');assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
      await page.locator('#navToggle').click();await page.locator('#navLinks a[href="inspirations.html"]').click();await page.waitForURL('**/inspirations.html');
    }
    checks.push('Mobile menu on all 6 pages: animation state, inertness, Escape, links and route navigation');
    await page.goto(`${base}/credits.html`);const credits=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();if(credits.violations.length)violations.push({page:'credits',violations:credits.violations});
    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const fallback=await noJS.newPage();await fallback.goto(`${base}/index.html`);assert.equal(await fallback.locator('#navLinks a').first().isVisible(),true);await fallback.locator('#navLinks a[href="reservation.html"]').click();assert.equal(await fallback.locator('noscript a').isVisible(),true);await noJS.close();checks.push('Navigation, content and direct WhatsApp fallback without JavaScript');
    const animatedContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'no-preference'});
    const animated=await animatedContext.newPage();
    animated.on('pageerror',error=>errors.push(error.message));
    for(const id of pages){
      await animated.goto(`${base}/${id}.html`,{waitUntil:'domcontentloaded'});
      await animated.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,65));}});
      await animated.waitForTimeout(800);
      assert.equal(await animated.locator('[data-reveal]:not(.is-visible)').count(),0,`${id}: all sections revealed`);
    }
    await animated.goto(`${base}/inspirations.html`);
    await animated.locator('#navToggle').click();
    await animated.waitForTimeout(350);
    assert.equal(await animated.locator('#navLinks').evaluate(el=>getComputedStyle(el).opacity),'1');
    await animated.keyboard.press('Escape');
    await animated.locator('.gallery-item').first().click();
    const touchCaption=await animated.locator('#dialogCaption').textContent();
    await animated.locator('#dialogImage').evaluate(el=>{
      const start=new Touch({identifier:1,target:el,clientX:280,clientY:300});
      el.dispatchEvent(new TouchEvent('touchstart',{touches:[start],changedTouches:[start],bubbles:true}));
      const end=new Touch({identifier:1,target:el,clientX:80,clientY:300});
      el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[end],bubbles:true}));
    });
    assert.notEqual(await animated.locator('#dialogCaption').textContent(),touchCaption);
    await animated.locator('#closeDialog').click();
    await animated.waitForTimeout(250);
    assert.equal(await animated.locator('#galleryDialog').evaluate(el=>el.open),false);
    assert.equal(await animated.locator('.gallery-item').first().evaluate(el=>el===document.activeElement),true);
    await animated.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await animated.locator('.gallery-item').first().evaluate(el=>getComputedStyle(el).animationName),'none');
    await animatedContext.close();
    checks.push('Normal motion: all sections revealed on 6 pages, animated menu, horizontal touch swipe, modal close/focus, reduced motion respected');
    const report={checks,layoutFailures,accessibilityViolations:violations.map(v=>({page:v.page,width:v.width,ids:v.violations.map(i=>i.id)})),errors,resources};
    fs.writeFileSync(`${out}/qa-results.json`,JSON.stringify(report,null,2));
    fs.writeFileSync(`${out}/axe.json`,JSON.stringify(violations,null,2));
    console.log(JSON.stringify(report,null,2));
    assert.equal(layoutFailures.length,0,'Layout failures: artifacts/v4/layout.json');
    assert.equal(violations.length,0,'Accessibility failures: artifacts/v4/axe.json');
    assert.deepEqual(errors,[]);assert.deepEqual(resources,[]);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
