'use strict';
(() => {
 const config=window.PHARM_PORTAL_DATA,products=window.PHARM_DATA.products,byCode=new Map(products.map(p=>[p.code,p]));
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const notices=()=>config.announcements.filter(n=>n.publishOn<=today()&&(!n.expiresOn||n.expiresOn>=today())).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.publishOn.localeCompare(a.publishOn)||a.id.localeCompare(b.id));
 const drugLink=r=>{const p=byCode.get(r.code);return p&&p.hospitalCode===r.hospitalCode?`<a class="linked-drug" href="#drug/${encodeURIComponent(p.code)}">${esc(p.name)} <code>${esc(p.code)}</code> ↗</a>`:'';};
 const empty=(title,text)=>`<div class="portal-empty"><span aria-hidden="true">—</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
 const noticeList=list=>list.length?`<div class="notice-list">${list.map(n=>`<a class="notice-row" href="#announcements/${encodeURIComponent(n.id)}"><time>${esc(n.publishOn.replaceAll('-','/'))}</time><span class="notice-type">${esc(n.type)}</span><strong>${n.pinned?'<small class="pin-label">置頂</small>':''}${esc(n.title)}</strong><span aria-hidden="true">↗</span></a>`).join('')}</div>`:empty('目前沒有公告','最新藥品異動與供應資訊將在此發布。');
 const categoryCards=()=>config.categories.map((c,i)=>`<a class="special-card" href="#special/${encodeURIComponent(c.id)}"><span class="special-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(c.label)}</h3><p>${esc(c.description)}</p></div><span class="special-arrow" aria-hidden="true">↗</span></a>`).join('');
 $('#special-grid').innerHTML=categoryCards();$('#home-notices').innerHTML=noticeList(notices().slice(0,3));
 function hide(){$('#directory-view').hidden=true;$('#nav-special').classList.remove('active');$('#nav-notices').classList.remove('active');}
 function render(raw){
  const special=raw==='special'||raw.startsWith('special/'),announcement=raw==='announcements'||raw.startsWith('announcements?')||raw.startsWith('announcements/');
  if(!special&&!announcement)return false;
  $('#search-view').hidden=true;$('#detail-view').hidden=true;$('#directory-view').hidden=false;document.body.classList.remove('results-mode');
  for(const name of ['search','saved','special','notices'])$('#nav-'+name).classList.toggle('active',special?name==='special':name==='notices');
  let title,subtitle,content,breadcrumb;
  if(special){
   const id=decodeURIComponent(raw.slice(8)),c=config.categories.find(c=>c.id===id);
   if(raw==='special'){title='藥品專區';subtitle='依照臨床查詢情境，集中查閱藥品與用藥注意事項。';content=`<div class="special-grid">${categoryCards()}</div>`;}
   else if(c){title=c.label;subtitle=c.description;breadcrumb='<a href="#special">藥品專區</a>';const entries=c.items.map(r=>({r,p:byCode.get(r.code)})).filter(({r,p})=>p&&p.hospitalCode===r.hospitalCode).sort((a,b)=>(a.p.generic||a.p.name).localeCompare(b.p.generic||b.p.name,'en',{sensitivity:'base'}));content=entries.length?`<div class="special-items">${entries.map(({r,p})=>`<article class="special-item">${p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.name)} 藥品照片" width="100" height="75">`:''}<div><h2><a href="#drug/${encodeURIComponent(p.code)}">${esc(p.name)} ↗</a></h2><p class="portal-code">${esc(p.code)} · 院碼 ${esc(p.hospitalCode)}</p>${r.note?`<p class="portal-text">${esc(r.note)}</p>`:''}${(r.relatedDrugs||[]).map(drugLink).join('')}${r.sourceUrl?`<a class="portal-source" href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">查閱依據 ↗</a>`:''}</div></article>`).join('')}</div>`:empty('尚未收錄品項','本專區清單由藥學部維護，完成品項資料後即可查閱。');}
   else{title='找不到此專區';subtitle='請返回藥品專區選擇查詢。';content='<a class="secondary" href="#special">返回藥品專區</a>';}
  }else{
   const detail=raw.startsWith('announcements/'),n=detail?notices().find(n=>n.id===decodeURIComponent(raw.slice(14))):null;
   if(detail&&n){title=n.title;subtitle=`${n.type} · 發布日期 ${n.publishOn.replaceAll('-','/')}`;breadcrumb='<a href="#announcements">藥品公告</a>';content=`<article class="announcement-content"><p class="portal-text">${esc(n.content)}</p>${(n.relatedDrugs||[]).length?`<div class="announcement-drugs"><h2>相關藥品</h2>${n.relatedDrugs.map(drugLink).join('')}</div>`:''}${n.sourceUrl?`<a class="portal-source" href="${esc(n.sourceUrl)}" target="_blank" rel="noopener noreferrer">公告附件／來源 ↗</a>`:''}${n.expiresOn?`<p class="portal-code">公告顯示至 ${esc(n.expiresOn.replaceAll('-','/'))}</p>`:''}</article>`;}
   else if(detail){title='目前無法查看此公告';subtitle='此公告可能已下架，請查閱最新公告。';content='<a class="secondary" href="#announcements">返回藥品公告</a>';}
   else{title='藥品公告';subtitle='掌握院內藥品異動、供應狀態與用藥安全資訊。';let type=new URLSearchParams(raw.split('?')[1]||'').get('type')||'全部';if(!config.noticeTypes.includes(type))type='全部';const list=notices().filter(n=>type==='全部'||n.type===type);content=`<div class="notice-filters" role="group" aria-label="公告分類">${['全部',...config.noticeTypes].map(t=>`<a class="${t===type?'selected':''}" aria-current="${t===type?'true':'false'}" href="#announcements${t==='全部'?'':'?type='+encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>${noticeList(list)}`;}
  }
  document.title=title+'｜屏基藥品查詢';$('#directory-view').innerHTML=`<div class="portal-wrap"><div class="breadcrumb"><a href="#">藥品查詢首頁</a><span>/</span>${breadcrumb||'<span>'+esc(special?'藥品專區':'藥品公告')+'</span>'}</div><div class="portal-heading"><span class="eyebrow subdued">${special?'MEDICATION SAFETY':'PHARMACY ANNOUNCEMENTS'}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${content}</div>`;window.scrollTo({top:0,behavior:'instant'});return true;
 }
 function related(p){const same=r=>r.code===p.code&&r.hospitalCode===p.hospitalCode;const categories=config.categories.filter(c=>c.items.some(same));const ns=notices().filter(n=>(n.relatedDrugs||[]).some(same));return categories.length||ns.length?`<div class="identity-box related-portal"><h2>相關專區與公告</h2>${categories.map(c=>`<a href="#special/${encodeURIComponent(c.id)}">${esc(c.label)} ↗</a>`).join('')}${ns.map(n=>`<a href="#announcements/${encodeURIComponent(n.id)}"><span class="notice-type">${esc(n.type)}</span> ${esc(n.title)} ↗</a>`).join('')}</div>`:'';}
 window.PHARM_PORTAL={render,hide,related};
})();
