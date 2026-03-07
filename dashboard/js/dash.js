(function(){
  const PASS='lune';
  const gate=document.getElementById('gate');
  const input=document.getElementById('gateInput');
  const btn=document.getElementById('gateBtn');
  const msg=document.getElementById('gateMsg');
  const remember=document.getElementById('gateRemember');
  function open(){ try{ gate.remove(); }catch{} }
  function fail(){ try{ msg.classList.remove('hidden'); }catch{} }
  function auth(){ if(!input) return; const v=input.value||''; if(v===PASS){ if(remember&&remember.checked) localStorage.setItem('LUNE_DASH_OK','1'); open(); } else { fail(); } }
  if(localStorage.getItem('LUNE_DASH_OK')==='1'){ open(); }
  if(btn) btn.addEventListener('click',auth);
  if(input) input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); auth(); } });
  document.querySelectorAll('.navbtn').forEach(b=>{ b.addEventListener('click',()=>{ document.querySelectorAll('.navbtn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); const id=b.getAttribute('data-panel'); document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); const tgt=document.getElementById('panel-'+id); if(tgt) tgt.classList.add('active'); }); });
  const TKEY='LUNE_USERS'; let selectedIndex=null; const tbody=document.querySelector('#dashTable tbody');
  function getUsers(){ try{return JSON.parse(localStorage.getItem(TKEY)||'[]');}catch{return [];} }
  function setUsers(a){ localStorage.setItem(TKEY, JSON.stringify(a)); }
  function render(){ const list=getUsers(); if(!tbody) return; tbody.innerHTML=''; list.forEach((r,i)=>{ const score=r.quickScore||(r.scan&&typeof r.scan.texture==='number'? Math.round(r.scan.texture*100):''); const tr=document.createElement('tr'); tr.innerHTML=`<td>${fmtDate(r.timestamp)}</td><td>${esc(r.intake?.name||'')}</td><td>${esc(r.intake?.email||'')}</td><td>${esc(r.payment?.product||'')}</td><td>${esc(score)}</td><td><button class="btn subtle" data-act="prompt" data-i="${i}">Prompt</button><button class="btn" data-act="report" data-i="${i}">Report</button></td>`; tbody.appendChild(tr); }); }
  render();
  tbody?.addEventListener('click',e=>{ const k=e.target.closest('button'); if(!k) return; const i=Number(k.getAttribute('data-i')); const act=k.getAttribute('data-act'); const users=getUsers(); selectedIndex=i; if(act==='report'){ localStorage.setItem('LUNE_APP_STATE', JSON.stringify(users[i])); window.location.href='../app/report/report.html'; } if(act==='prompt'){ openPromptFor(users[i]); } });
  function openPromptFor(rec){ document.querySelector('[data-panel="prompt"]').click(); set('ctxName', rec.intake?.name||'—'); set('ctxPlan', rec.payment?.product||'—'); set('ctxScore', (typeof rec.quickScore==='number'?rec.quickScore:'—')); const goals=(rec.intake?.skinGoals||[]).join(', '); const allergies=(rec.intake?.allergies||[]).join(', '); const type=rec.intake?.skinType||'—'; const score=rec.quickScore||''; const tpl=`Client: ${rec.intake?.name||'—'}\nEmail: ${rec.intake?.email||'—'}\nSkin type: ${type}\nGoals: ${goals}\nAllergies: ${allergies}\nQuick Score: ${score}/100\n\nTask: Draft a friendly follow-up (100–140 words) explaining the most important next steps from the plan, respecting pregnancy/allergies, and suggesting when to book a re-scan.`; const pt=document.getElementById('promptText'); if(pt) pt.value=tpl; const rj=document.getElementById('resultsJson'); if(rj) rj.value=JSON.stringify(rec,null,2); }
  document.getElementById('btnPromptClear')?.addEventListener('click',()=>{ const pt=document.getElementById('promptText'); const po=document.getElementById('promptOut'); if(pt) pt.value=''; if(po) po.textContent=''; });
  document.getElementById('btnGenerate')?.addEventListener('click',()=>{ const pt=document.getElementById('promptText'); const po=document.getElementById('promptOut'); const txt=pt?.value?.trim()||''; if(po) po.textContent = txt ? ('— Note saved with context —\n\n'+txt) : '— No input —'; });
  document.getElementById('btnPromptSave')?.addEventListener('click',()=>{ if(selectedIndex===null) return; const users=getUsers(); users[selectedIndex].internalNote={ savedAt:new Date().toISOString(), text:document.getElementById('promptText')?.value||'', output:document.getElementById('promptOut')?.textContent||'' }; setUsers(users); alert('Note saved into record.'); });
  document.getElementById('btnResultsFormat')?.addEventListener('click',()=>{ try{ const el=document.getElementById('resultsJson'); const obj=JSON.parse(el?.value||'{}'); if(el) el.value=JSON.stringify(obj,null,2); }catch{ alert('Invalid JSON'); } });
  document.getElementById('btnResultsRestore')?.addEventListener('click',()=>{ if(selectedIndex===null) return; const el=document.getElementById('resultsJson'); const users=getUsers(); if(el) el.value=JSON.stringify(users[selectedIndex],null,2); });
  document.getElementById('btnResultsSave')?.addEventListener('click',()=>{ if(selectedIndex===null) return; try{ const el=document.getElementById('resultsJson'); const obj=JSON.parse(el?.value||'{}'); const users=getUsers(); users[selectedIndex]=obj; setUsers(users); render(); alert('Record updated.'); }catch{ alert('Invalid JSON'); } });
  document.getElementById('btnExportCsv')?.addEventListener('click',()=>{ const rec=getUsers(); let csv='timestamp,name,email,product,score\n'; rec.forEach(r=>{ const score=r.quickScore||(r.scan&&Math.round(r.scan.texture*100))||''; csv+=`${r.timestamp||''},${safe(r.intake?.name)},${safe(r.intake?.email)},${safe(r.payment?.product)},${score}\n`; }); download('users.csv',csv); });
  document.getElementById('btnClearAll')?.addEventListener('click',()=>{ if(confirm('Clear all local records?')){ localStorage.removeItem(TKEY); render(); } });
  function set(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function fmtDate(iso){ try{ return new Date(iso).toLocaleString(); }catch{ return ''; } }
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function safe(x){ return (x==null?'':String(x)).replaceAll('"','""'); }
  function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'})); a.download=name; a.click(); }
})();
