// アプリ本体
const APP_KEY = 'grandshop-2026-purchaser-app-v1';
const LEGACY_QTY_KEY = 'grandshop-2026-order-v2';
const LEGACY_BONUS_KEY = 'grandshop-2026-bonus-v2';

const defaultApp = {
  purchasers: [{id:'me', name:'わたし'}],
  activePurchaserId: 'me',
  quantities: {me:{}},
  bonusByPurchaser: {me:{yukata:0,shining:0,raging:0}},
  purchasedByPurchaser: {me:{}},
  soldOut: {}
};

let app;
try {
  app = JSON.parse(localStorage.getItem(APP_KEY) || 'null');
} catch(e) {}

if (!app || !Array.isArray(app.purchasers)) {
  app = JSON.parse(JSON.stringify(defaultApp));
  // 昨日版に入力済みの数量があれば「わたし」へ引き継ぐ
  try {
    const legacyQty = JSON.parse(localStorage.getItem(LEGACY_QTY_KEY) || '{}');
    const legacyBonus = JSON.parse(localStorage.getItem(LEGACY_BONUS_KEY) || '{"yukata":0,"shining":0,"raging":0}');
    app.quantities.me = legacyQty;
    app.bonusByPurchaser.me = legacyBonus;
  } catch(e) {}
}
app.quantities ||= {};
app.bonusByPurchaser ||= {};
app.purchasedByPurchaser ||= {};
app.soldOut ||= {};
app.purchasers.forEach(p=>{
  app.quantities[p.id] ||= {};
  app.bonusByPurchaser[p.id] ||= {yukata:0,shining:0,raging:0};
  app.purchasedByPurchaser[p.id] ||= {};
});
app.activePurchaserId ||= 'me';

const yen = n => '¥' + Number(n||0).toLocaleString('ja-JP');
const isAll = () => app.activePurchaserId === 'all';
const activeBuyer = () => app.purchasers.find(p=>p.id===app.activePurchaserId);
const buyerQtys = id => app.quantities[id] ||= {};
const buyerBonus = id => app.bonusByPurchaser[id] ||= {yukata:0,shining:0,raging:0};
const buyerPurchased = id => app.purchasedByPurchaser[id] ||= {};

function saveApp(){
  try { localStorage.setItem(APP_KEY, JSON.stringify(app)); } catch(e) {}
}

function getQty(id, purchaserId=app.activePurchaserId){
  if (purchaserId === 'all') {
    return app.purchasers.reduce((sum,p)=>sum+Number((app.quantities[p.id]||{})[id]||0),0);
  }
  return Number((app.quantities[purchaserId]||{})[id]||0);
}
function getPurchased(id,purchaserId=app.activePurchaserId){
  if (purchaserId === 'all') {
    return app.purchasers.length > 0 && app.purchasers.every(p=>!!(app.purchasedByPurchaser[p.id]||{})[id]);
  }
  return !!(app.purchasedByPurchaser[purchaserId]||{})[id];
}
function getSoldOut(id){
  return !!app.soldOut[id];
}
function total(purchaserId=app.activePurchaserId){
  return products.reduce((s,p)=>s+getQty(p.id,purchaserId)*p.price,0);
}
function bonusTotal(purchaserId=app.activePurchaserId){
  return Math.floor(total(purchaserId)/3000);
}
function combinedBonus(){
  return app.purchasers.reduce((acc,p)=>{
    const b=buyerBonus(p.id);
    acc.yukata += Number(b.yukata||0);
    acc.shining += Number(b.shining||0);
    acc.raging += Number(b.raging||0);
    return acc;
  }, {yukata:0,shining:0,raging:0});
}

function setupFilters() {
  const months=[...new Set(products.map(p=>p.releaseMonth).filter(Boolean))].sort();
  document.getElementById('month').innerHTML='<option value="">全年月</option>'+months.map(x=>`<option value="${x}">${x.replace('-', '年')}月</option>`).join('');

  const categories=[...new Set(products.map(p=>p.category).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'ja'));
  document.getElementById('category').innerHTML =
    '<option value="">全カテゴリ</option>' +
    '<option value="__random__">トレーディング</option>' +
    categories.map(category => `<option value="${category}">${category}</option>`).join('');

  document.getElementById('unit').innerHTML =
    '<option value="">全所属</option>' +
    PRODUCT_MASTER.units.map(unit => `<option value="unit:${unit.id}">${unit.name}</option>`).join('') +
    '<option value="affiliation:prince-cat">PRINCE CAT</option>' +
    '<option value="affiliation:mascot">マスコットキャラクター</option>';

  const unitGroups = PRODUCT_MASTER.units.map(unit => {
    const options = unit.characters.map(character =>
      `<option value="character:${character.id}">${character.name}</option>`
    ).join('');
    return `<optgroup label="${unit.name}">${options}</optgroup>`;
  }).join('');

  const catOptions = PRODUCT_MASTER.princeCats.map(cat => {
    const info = MASTER_INDEX.princeCats.get(cat.id);
    return `<option value="princeCat:${cat.id}">${cat.name}（${info.character}）</option>`;
  }).join('');

  const reserved = new Set([
    ...PRODUCT_MASTER.units.flatMap(unit => unit.characters.flatMap(character => [character.name, character.shortName, ...(character.aliases || [])].map(normalizeMasterName))),
    ...PRODUCT_MASTER.princeCats.map(cat => normalizeMasterName(cat.name)),
    ...PRODUCT_MASTER.mascots.flatMap(mascot => [mascot.name, ...(mascot.aliases || [])].map(normalizeMasterName))
  ]);
  const otherVariants = [...new Set(products.map(p=>p.variant).filter(Boolean))]
    .filter(value => !reserved.has(normalizeMasterName(value)))
    .sort((a,b)=>a.localeCompare(b,'ja'));
  const otherOptions = otherVariants.map(value =>
    `<option value="variant:${value}">${value}</option>`
  ).join('');

  document.getElementById('character').innerHTML =
    '<option value="">全キャラクター・種類</option>' +
    unitGroups +
    `<optgroup label="PRINCE CAT">${catOptions}</optgroup>` +
    '<optgroup label="マスコットキャラクター"><option value="affiliation:mascot">マスコットキャラクター</option></optgroup>' +
    `<optgroup label="その他・種類">${otherOptions}</optgroup>`;
}

function renderTabs(){
  const tabs = [{id:'all',name:'全体'}, ...app.purchasers];
  document.getElementById('purchaserTabs').innerHTML =
    tabs.map(p=>`<button class="purchaser-tab ${app.activePurchaserId===p.id?'active':''}" data-id="${p.id}">${p.name}</button>`).join('') +
    '<button class="purchaser-tab add" id="addPurchaser">＋ 追加</button>';

  document.querySelectorAll('.purchaser-tab[data-id]').forEach(btn=>{
    btn.onclick=()=>{
      app.activePurchaserId=btn.dataset.id;
      saveApp();
      syncBonusInputs();
      render();
    };
  });
  document.getElementById('addPurchaser').onclick=()=>{
    document.getElementById('purchaserName').value='';
    document.getElementById('purchaserDialog').showModal();
    setTimeout(()=>document.getElementById('purchaserName').focus(),50);
  };
}

function render() {
  renderTabs();
  const q=document.getElementById('search').value.toLowerCase();
  const month=document.getElementById('month').value;
  const unitFilter=document.getElementById('unit').value;
  const characterFilter=document.getElementById('character').value;
  const category=document.getElementById('category').value;
  const selected=document.getElementById('selected').value;

  const visible=products.filter(p=>{
    const n=getQty(p.id);
    const purchased=getPurchased(p.id);
    const soldOut=getSoldOut(p.id);
    const hit=p.searchText.includes(q);
    let unitHit=true;
    if (unitFilter) {
      const [type, value] = unitFilter.split(':');
      unitHit = type==='unit' ? p.unitId===value
        : type==='affiliation' ? p.affiliation===value
        : true;
    }
    let characterHit=true;
    if (characterFilter) {
      const [type, ...rest] = characterFilter.split(':');
      const value = rest.join(':');
      characterHit = type==='character' ? p.characterId===value
        : type==='princeCat' ? p.princeCatId===value
        : type==='affiliation' ? p.affiliation===value
        : type==='variant' ? p.variant===value
        : true;
    }
    const categoryHit=!category || (category==='__random__' ? p.random : (!p.random && p.category===category));
    const selectedHit = !selected
      || (selected==='selected' && n>0)
      || (selected==='unselected' && n===0)
      || (selected==='unpurchased' && n>0 && !purchased && !soldOut)
      || (selected==='purchased' && purchased)
      || (selected==='available' && !soldOut)
      || (selected==='soldout' && soldOut);
    return hit && (!month||p.releaseMonth===month) && unitHit && characterHit && categoryHit && selectedHit;
  });

  document.getElementById('list').innerHTML=visible.map(p=>{
    const n=getQty(p.id);
    const purchased=getPurchased(p.id);
    const soldOut=getSoldOut(p.id);
    const limitNote=p.limit?`購入制限 ${p.limit}個`:'';
    const qtyControl = isAll()
      ? `<div class="qty aggregate"><button disabled>−</button><input value="${n}" readonly aria-label="全体数量"><button disabled>＋</button></div>`
      : `<div class="qty">
          <button ${soldOut?'disabled':''} onclick="changeQty('${p.id}',-1,${p.limit||999})">−</button>
          <input type="number" min="0" max="${p.limit||999}" value="${n}" ${soldOut?'disabled':''} onchange="setQty('${p.id}',this.value,${p.limit||999})">
          <button ${soldOut?'disabled':''} onclick="changeQty('${p.id}',1,${p.limit||999})">＋</button>
        </div>`;
    const purchaseControl = isAll()
      ? ''
      : `<button type="button" class="purchase-check ${purchased?'checked':''}" onclick="togglePurchased('${p.id}')">
          ${purchased?'購入済み':'未購入'}
        </button>`;
    const soldOutControl = `<button type="button" class="soldout-check ${soldOut?'checked':''}" onclick="toggleSoldOut('${p.id}')">
      ${soldOut?'売り切れ':'販売中'}
    </button>`;
    return `<article class="item ${n>0?'active':''} ${purchased?'purchased':''} ${soldOut?'soldout':''}">
      <div class="thumb"><img loading="lazy" src="${p.image}" alt=""></div>
      <div>
        <div class="name">${p.name}</div>
        ${p.variant?`<div class="variant">${p.variant}</div>`:''}
        <div class="meta">No.${p.code}／${p.releaseDate}${limitNote?'／'+limitNote:''}</div>
        <div class="price">${yen(p.price)}${n>0?' × '+n+' ＝ '+yen(p.price*n):''}</div>
        ${p.random?'<span class="random-badge">トレーディング</span>':''}
      </div>
      ${qtyControl}
      <div class="item-actions">${soldOutControl}${purchaseControl}</div>
    </article>`;
  }).join('');

  const selectedCount=products.reduce((s,p)=>s+getQty(p.id),0);
  document.getElementById('count').textContent=selectedCount+'点';
  document.getElementById('total').textContent=yen(total());
  document.getElementById('bonusTotal').textContent=bonusTotal()+'枚';

  document.getElementById('viewNote').textContent = isAll()
    ? '全員分を合算して表示しています。数量の変更は各購入者タブで行います。'
    : `${activeBuyer()?.name || ''}さんの買い物リストを編集中です。`;

  document.querySelector('.bonus').style.opacity = isAll() ? '.86' : '1';
  ['yukata','mysticalShining','mysticalRaging'].forEach(id=>{
    document.getElementById(id).disabled=isAll();
  });
  updateBonus();
}

function setQty(id,value,limit=999) {
  if(isAll() || getSoldOut(id)) return;
  let n=Math.max(0,Number(value)||0);
  if(n>limit) {
    alert(`購入制限は${limit}個です`);
    n=limit;
  }
  buyerQtys(app.activePurchaserId)[id]=n;
  saveApp(); render();
}
function changeQty(id,d,limit=999) {
  setQty(id,getQty(id)+d,limit);
}
function togglePurchased(id){
  if(isAll()) return;
  const purchased=buyerPurchased(app.activePurchaserId);
  purchased[id]=!purchased[id];
  saveApp();
  render();
}
function toggleSoldOut(id){
  app.soldOut[id]=!app.soldOut[id];
  saveApp();
  render();
}

function currentBonus(){
  return isAll() ? combinedBonus() : buyerBonus(app.activePurchaserId);
}
function syncBonusInputs(){
  const b=currentBonus();
  document.getElementById('yukata').value=b.yukata||0;
  document.getElementById('mysticalShining').value=b.shining||0;
  document.getElementById('mysticalRaging').value=b.raging||0;
}
function updateBonus() {
  const bt=bonusTotal();
  const b=currentBonus();
  const allocated=(b.yukata||0)+(b.shining||0)+(b.raging||0);
  const diff=bt-allocated;
  const el=document.getElementById('bonusCheck');
  if(diff===0) {
    el.textContent=`特典${bt}枚／配分${allocated}枚　✓ 一致`;
    el.style.color='';
  } else if(diff>0) {
    el.textContent=`特典${bt}枚／配分${allocated}枚　あと${diff}枚未配分`;
    el.style.color='#b36b00';
  } else {
    el.textContent=`特典${bt}枚／配分${allocated}枚　${Math.abs(diff)}枚オーバー`;
    el.style.color='var(--danger)';
  }
}

['search'].forEach(id=>document.getElementById(id).addEventListener('input',render));
['month','unit','character','category','selected'].forEach(id=>document.getElementById(id).addEventListener('change',render));

[
  ['yukata','yukata'],
  ['mysticalShining','shining'],
  ['mysticalRaging','raging']
].forEach(([id,key])=>{
  const el=document.getElementById(id);
  el.addEventListener('input',()=>{
    if(isAll()) return;
    buyerBonus(app.activePurchaserId)[key]=Math.max(0,Number(el.value)||0);
    saveApp(); updateBonus();
  });
});

document.getElementById('cancelPurchaser').addEventListener('click',()=>{
  document.getElementById('purchaserName').blur();
  document.getElementById('purchaserDialog').close();
});

document.getElementById('purchaserForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('purchaserName').value.trim();
  if(!name) return;
  const id='p-'+Date.now();
  app.purchasers.push({id,name});
  app.quantities[id]={};
  app.bonusByPurchaser[id]={yukata:0,shining:0,raging:0};
  app.purchasedByPurchaser[id]={};
  app.activePurchaserId=id;
  saveApp();
  document.getElementById('purchaserDialog').close();
  syncBonusInputs();
  render();
});

function renderManage(){
  const list=document.getElementById('manageList');
  list.innerHTML=app.purchasers.map(p=>`
    <div class="manage-row">
      <b>${p.name}</b>
      <button class="rename" data-rename="${p.id}">名前変更</button>
      <button class="delete" data-delete="${p.id}" ${app.purchasers.length===1?'disabled':''}>削除</button>
    </div>`).join('');
  list.querySelectorAll('[data-rename]').forEach(btn=>btn.onclick=()=>{
    const p=app.purchasers.find(x=>x.id===btn.dataset.rename);
    const next=prompt('購入者名を変更',p.name);
    if(next?.trim()){p.name=next.trim();saveApp();renderManage();render();}
  });
  list.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>{
    const p=app.purchasers.find(x=>x.id===btn.dataset.delete);
    if(!p || !confirm(`${p.name}さんの数量データも削除しますか？`)) return;
    app.purchasers=app.purchasers.filter(x=>x.id!==p.id);
    delete app.quantities[p.id];
    delete app.bonusByPurchaser[p.id];
    delete app.purchasedByPurchaser[p.id];
    if(app.activePurchaserId===p.id) app.activePurchaserId='all';
    saveApp();renderManage();syncBonusInputs();render();
  });
}
document.getElementById('managePurchasers').onclick=()=>{
  renderManage();document.getElementById('manageDialog').showModal();
};
document.getElementById('closeManage').onclick=()=>document.getElementById('manageDialog').close();

document.getElementById('copy').onclick=async()=>{
  const buyerLabel=isAll()?'全体':(activeBuyer()?.name||'購入者');
  const selected=products.filter(p=>getQty(p.id)>0 && !getSoldOut(p.id));
  const lines=[`GRAND SHOP 2026 買い物メモ（${buyerLabel}）`,''];
  selected.forEach(p=>{
    lines.push(`・${p.name}${p.variant?'／'+p.variant:''} ×${getQty(p.id)}　${yen(p.price*getQty(p.id))}`);
  });
  const b=currentBonus();
  lines.push('',
    `合計金額：${yen(total())}`,
    `特典：${bonusTotal()}枚`,
    `YUKATA-MODE Ver.：${b.yukata||0}枚`,
    `Mystical Curiosities Ver. シャイニング事務所：${b.shining||0}枚`,
    `Mystical Curiosities Ver. レイジングエンターテインメント：${b.raging||0}枚`
  );
  await navigator.clipboard.writeText(lines.join('\n'));
  alert(`${buyerLabel}の買い物メモをコピーしました`);
};

let currentShareBlob = null;
let currentShareUrl = '';

function roundedRect(ctx,x,y,w,h,r){
  const radius=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}

function wrapCanvasText(ctx,text,maxWidth){
  const chars=[...String(text)];
  const lines=[];
  let line='';
  chars.forEach(ch=>{
    const test=line+ch;
    if(line && ctx.measureText(test).width>maxWidth){
      lines.push(line);
      line=ch;
    }else line=test;
  });
  if(line) lines.push(line);
  return lines.length?lines:[''];
}

function makeShareCanvas(){
  const buyerLabel=isAll()?'全体':(activeBuyer()?.name||'購入者');
  const selectedProducts=products.filter(p=>getQty(p.id)>0 && !getSoldOut(p.id));
  const b=currentBonus();
  const itemCount=selectedProducts.reduce((sum,p)=>sum+getQty(p.id),0);

  const W=1080;
  const pad=72;
  const contentW=W-pad*2;
  const lineHeight=38;
  const itemGap=18;

  // 実際の折り返し行数から必要な高さを計算
  const measure=document.createElement('canvas').getContext('2d');
  measure.font='600 28px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  let itemsHeight=selectedProducts.length?0:96;
  selectedProducts.forEach(p=>{
    const title=`${p.name}${p.variant?'／'+p.variant:''}`;
    const lines=wrapCanvasText(measure,title,contentW-220);
    itemsHeight+=Math.max(78,lines.length*lineHeight+18)+itemGap;
  });
  const H=Math.max(1350,420+itemsHeight+430);
  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  ctx.fillStyle='#faf7fb'; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,260);
  grad.addColorStop(0,'#7a4fa3'); grad.addColorStop(1,'#ad7fc4');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,270);

  ctx.fillStyle='#fff';
  ctx.font='700 46px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText('GRAND SHOP 2026',pad,102);
  ctx.font='500 25px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText('買い物リスト',pad,148);
  ctx.font='700 38px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText(buyerLabel,pad,222);

  let y=318;
  const summaryGap=18;
  const summaryW=(contentW-summaryGap*2)/3;
  const summaries=[['商品数',itemCount+'点'],['合計',yen(total())],['特典',bonusTotal()+'枚']];
  summaries.forEach(([label,value],i)=>{
    const x=pad+i*(summaryW+summaryGap);
    ctx.fillStyle='#fff'; roundedRect(ctx,x,y,summaryW,142,24); ctx.fill();
    ctx.fillStyle='#746c79'; ctx.font='500 22px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(label,x+24,y+42);
    ctx.fillStyle='#7a4fa3'; ctx.font='700 31px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(value,x+24,y+96);
  });

  y+=194;
  ctx.fillStyle='#292433'; ctx.font='700 31px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText('選択商品',pad,y);
  y+=30;

  if(!selectedProducts.length){
    ctx.fillStyle='#fff'; roundedRect(ctx,pad,y,contentW,96,20); ctx.fill();
    ctx.fillStyle='#746c79'; ctx.font='500 25px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText('選択されている商品はありません',pad+28,y+58);
    y+=118;
  }else{
    selectedProducts.forEach(p=>{
      const qty=getQty(p.id);
      const title=`${p.name}${p.variant?'／'+p.variant:''}`;
      ctx.font='600 28px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
      const lines=wrapCanvasText(ctx,title,contentW-220);
      const boxH=Math.max(78,lines.length*lineHeight+18);
      ctx.fillStyle='#fff'; roundedRect(ctx,pad,y,contentW,boxH,18); ctx.fill();
      ctx.fillStyle='#292433';
      lines.forEach((line,i)=>ctx.fillText(line,pad+24,y+39+i*lineHeight));
      ctx.textAlign='right';
      ctx.fillStyle='#7a4fa3'; ctx.font='700 27px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillText(`×${qty}`,W-pad-24,y+38);
      ctx.fillStyle='#292433'; ctx.font='600 23px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillText(yen(p.price*qty),W-pad-24,y+boxH-16);
      ctx.textAlign='left';
      y+=boxH+itemGap;
    });
  }

  y+=20;
  const bonusH=250;
  ctx.fillStyle='#fff'; roundedRect(ctx,pad,y,contentW,bonusH,24); ctx.fill();
  ctx.fillStyle='#292433'; ctx.font='700 30px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText('特典の希望内訳',pad+28,y+48);
  const bonusRows=[
    ['YUKATA-MODE Ver.',b.yukata||0],
    ['Mystical／シャイニング',b.shining||0],
    ['Mystical／レイジング',b.raging||0]
  ];
  bonusRows.forEach(([label,value],i)=>{
    const ry=y+96+i*46;
    ctx.fillStyle='#746c79'; ctx.font='500 24px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(label,pad+28,ry);
    ctx.textAlign='right'; ctx.fillStyle='#7a4fa3'; ctx.font='700 25px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(`${value}枚`,W-pad-28,ry); ctx.textAlign='left';
  });

  ctx.fillStyle='#746c79'; ctx.font='500 20px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.textAlign='center'; ctx.fillText('GRAND SHOP 2026 代行メモ',W/2,H-48); ctx.textAlign='left';
  return canvas;
}

async function buildShareImage(){
  const dialog=document.getElementById('shareDialog');
  const wrap=document.getElementById('sharePreviewWrap');
  wrap.innerHTML='<div class="share-generating">画像を作成しています…</div>';
  dialog.showModal();
  await new Promise(resolve=>requestAnimationFrame(resolve));

  try{
    const canvas=makeShareCanvas();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('画像の作成に失敗しました')),'image/png'));
    if(currentShareUrl) URL.revokeObjectURL(currentShareUrl);
    currentShareBlob=blob;
    currentShareUrl=URL.createObjectURL(blob);

    const img=new Image();
    img.src=currentShareUrl;
    img.alt='共有用の買い物リスト画像';
    wrap.replaceChildren(img);

    const buyerLabel=isAll()?'全体':(activeBuyer()?.name||'購入者');
    const safeName=buyerLabel.replace(/[\\/:*?"<>|]/g,'_');
    const download=document.getElementById('downloadImage');
    download.href=currentShareUrl;
    download.download=`grandshop-2026-${safeName}.png`;

    const shareBtn=document.getElementById('shareNative');
    const file=new File([blob],download.download,{type:'image/png'});
    const canShare=!!(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]})));
    shareBtn.hidden=!canShare;
    shareBtn.onclick=async()=>{
      try{
        await navigator.share({title:'GRAND SHOP 2026 買い物リスト',files:[file]});
      }catch(e){
        if(e?.name!=='AbortError') alert('共有できませんでした。画像を長押しするか「画像を保存」を使ってください。');
      }
    };
  }catch(e){
    console.error(e);
    wrap.innerHTML='<div class="share-generating">画像を作成できませんでした。ページを再読み込みして、もう一度お試しください。</div>';
    document.getElementById('shareNative').hidden=true;
    document.getElementById('downloadImage').removeAttribute('href');
  }
}

document.getElementById('shareImage').onclick=buildShareImage;
document.getElementById('closeShare').onclick=()=>document.getElementById('shareDialog').close();
document.getElementById('shareDialog').addEventListener('close',()=>{});


setupFilters();
syncBonusInputs();
render();