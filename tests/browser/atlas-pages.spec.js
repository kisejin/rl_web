import { test, expect } from "@playwright/test";
import { atlasTopics } from "../../src/atlas-content.js";

test("35 independent pages load and decode their actual Manim videos", async ({page}) => {
  test.setTimeout(180000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const t of atlasTopics) {
    await page.goto(`/atlas/${t.id}/`);
    await expect(page.locator('h1')).toHaveText(t.title);
    await expect(page.locator('.lesson-nav [aria-current="page"]')).toHaveAttribute('href',`/atlas/${t.id}/`);
    const video = page.locator('[data-atlas-film] video');
    await expect(video).toHaveAttribute('preload','none');
    expect(await video.evaluate(v=>v.paused)).toBe(true);
    const decoded = await video.evaluate(async v=> {
      v.muted=true;
      await v.play();
      await new Promise((resolve,reject)=> {
        if(v.readyState>=2) resolve();
        else {v.addEventListener('loadeddata',resolve,{once:true});v.addEventListener('error',reject,{once:true});}
      });
      const r={width:v.videoWidth,height:v.videoHeight,duration:v.duration};v.pause();return r;
    });
    expect(decoded.width).toBe(960);
    expect(decoded.height).toBe(540);
    expect(decoded.duration).toBeGreaterThanOrEqual(19.8);
    await expect(page.locator('.katex-error')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("clean-page anchors survive refresh, legacy links redirect and global navigation returns to root",async({page})=>{
  await page.goto('/#atlas/ppo');
  await expect(page).toHaveURL(/\/atlas\/ppo\/$/);
  const toc=page.locator('.doc-toc [data-doc-target]').filter({hasText:'A worked numerical example'});
  await toc.click();
  await expect(page).toHaveURL(/\/atlas\/ppo\/#section-\d+-a-worked/);
  const url=page.url();
  await page.reload();
  await expect(page.locator('h1')).toContainText('PPO');
  expect(page.url()).toBe(url);
  const target=await toc.getAttribute('data-doc-target');
  await expect.poll(async()=>page.locator('#'+target).evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(180);
  await page.getByRole('link',{name:'Code labs 36',exact:true}).click();
  await expect(page).toHaveURL(/\/#labs$/);
  await expect(page.locator('.lab-row').first()).toBeVisible();
});

test("Manim transcript seeking, playback speed and live diagram playback work together",async({page})=>{
  await page.goto('/atlas/ppo/');
  const film=page.locator('[data-atlas-film]');
  const video=film.locator('video');
  await film.getByText('Read the animation transcript',{exact:true}).click();
  await film.locator('[data-film-seek]').nth(2).click();
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(8);
  await film.getByLabel('Animation playback speed').selectOption('1.5');
  expect(await video.evaluate(v=>v.playbackRate)).toBe(1.5);
  await page.getByRole('button',{name:'Play atlas animation',exact:true}).click();
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await film.getByRole('button',{name:'Replay Manim animation',exact:true}).click();
  await expect(page.getByRole('button',{name:'Play atlas animation',exact:true})).toBeVisible();
  expect(await video.evaluate(v=>v.paused)).toBe(false);
  await page.setViewportSize({width:390,height:844});
  await expect(film).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await film.screenshot({path:'/tmp/rl-atlas-manim-mobile.png'});
});
