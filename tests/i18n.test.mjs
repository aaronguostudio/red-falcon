import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createI18n,MESSAGES,LOCALE_STORAGE_KEY} from '../dist/src/i18n.js';
import {Game,WEAPONS,SECTORS} from '../dist/src/game.js';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
}

test('first visit is English; saved Chinese survives a new session without changing scores',()=>{
  const storage=memoryStorage({'red-falcon-best-normal':'21000'});
  const first=createI18n(storage);
  assert.equal(first.locale,'en');
  assert.equal(first.t('action.start'),'Start mission');
  first.setLocale('zh-CN');
  const second=createI18n(storage);
  assert.equal(second.locale,'zh-CN');
  assert.equal(second.t('action.start'),'开始行动');
  assert.equal(storage.getItem('red-falcon-best-normal'),'21000');
  second.setLocale('en');
  assert.equal(createI18n(storage).locale,'en');
});

test('missing, unsupported and blocked preferences fall back safely to English',()=>{
  for(const value of [null,'fr','zh','']){
    const i18n=createI18n(memoryStorage({[LOCALE_STORAGE_KEY]:value}));
    assert.equal(i18n.locale,'en');
    assert.equal(i18n.setLocale('unsupported'),false);
    assert.equal(i18n.locale,'en');
  }
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  const i18n=createI18n(blocked);
  assert.equal(i18n.locale,'en');
  assert.doesNotThrow(()=>i18n.setLocale('zh-CN'));
  assert.equal(i18n.t('action.resume'),'继续行动');
});

test('every message has both translations and matching interpolation fields',()=>{
  const fields=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const [key,pair]of Object.entries(MESSAGES)){
    assert.equal(pair.length,2,key);
    assert.ok(pair.every(v=>typeof v==='string'&&v.trim().length>0),key);
    assert.deepEqual(fields(pair[0]),fields(pair[1]),key);
    assert.doesNotMatch(pair[0],/\p{Script=Han}/u,key);
  }
});

test('all interface, engine and canvas translation references resolve',()=>{
  const html=file('dist/index.html');
  assert.match(html,/<html lang="en">/);
  const keys=[...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(m=>m[1]);
  for(const path of ['dist/src/main.js','dist/src/game.js','dist/src/render.js']){
    const source=file(path);
    for(const match of source.matchAll(/(?:\bt\(|\bkey:)\s*'([^']+)'/g))keys.push(match[1]);
    assert.doesNotMatch(source,/\p{Script=Han}/u,`${path} has untranslated text`);
  }
  keys.push(...WEAPONS.map(w=>w.nameKey),...SECTORS.flatMap(s=>[s.nameKey,s.objectiveKey]));
  keys.push('boss.volley','boss.mortar','boss.wave','difficulty.normalNote','difficulty.veteranNote');
  for(const key of keys)assert.ok(Object.hasOwn(MESSAGES,key),`Missing translation: ${key}`);
});

test('active engine notifications and floating pickups translate at display time',()=>{
  const events=[],g=new Game({onEvent:e=>events.push(e)}),i18n=createI18n();
  g.start();g.player.x=750;g.player.y=532;g.update(1/60);
  const notification=events.find(e=>e.type==='notice'&&e.message.key==='notice.weapon');
  const floating=g.texts.find(text=>text.text.key==='weapon.swarm');
  assert.ok(notification);assert.ok(floating);
  assert.equal(i18n.text(notification.message),'Swarm Shot unlocked · Q to switch');
  assert.equal(i18n.text(floating.text),'Swarm Shot');
  i18n.setLocale('zh-CN');
  assert.equal(i18n.text(notification.message),'蜂群散射炮已解锁 · Q 切换武器');
  assert.equal(i18n.text(floating.text),'蜂群散射炮');
  assert.equal(i18n.text('+250'),'+250');
  assert.equal(i18n.t('victory.best',{difficulty:{key:'difficulty.normal'},score:'21,000'}),'标准模式最佳纪录：21,000');
});
