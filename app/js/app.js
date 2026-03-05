/* Lune Beauty — Camera + Flow Fix
   - Disclaimer modal before starting camera
   - getUserMedia permission prompt (HTTPS/localhost required)
   - Live preview + capture to dataURL
   - Fallback to upload if camera not available
   - Safe navigation + stream cleanup
*/

window.AppState = window.AppState || { scanMetrics:{}, intake:{}, payment:{} };

function navigateTo(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  const el=document.getElementById(id); if(el) el.classList.remove('hidden');
  // Stop camera when leaving camera screen
  if(id !== 'screenCamera') LuneCamera.stop();
}

(function(){
  // Locale
  const sel=document.getElementById('locale');
  if(sel){ sel.addEventListener('change',()=>{ LuneI18n.setLocale(sel.value); applyLocale();}); LuneI18n.setLocale(sel.value||'en'); }

  // Nav buttons
  document.querySelectorAll('.nav [data-nav], .screen [data-nav], #btnStart').forEach(el=>{
    el.addEventListener('click',()=> navigateTo(el.getAttribute('data-nav')||'screenCamera'));
  });

  // Flow buttons (if present)
  const deep=document.getElementById('btnDeep'); if(deep) deep.addEventListener('click',()=>navigateTo('screenIntake'));
  const comp=document.getElementById('btnCompanion'); if(comp) comp.addEventListener('click',()=>navigateTo('screenIntake'));
  const back=document.getElementById('btnBackToScore'); if(back) back.addEventListener('click',()=>navigateTo('screenQuickScore'));
  const cont=document.getElementById('btnProceedPayment'); if(cont) cont.addEventListener('click',()=>navigateTo('screenPayment'));

  const toReport=document.getElementById('toReportBtn');
  if(toReport){ toReport.addEventListener('click',()=>{ saveUserRecord(); localStorage.setItem('LUNE_APP_STATE', JSON.stringify({ locale:LuneI18n.locale(), scanMetrics:AppState.scanMetrics||{}, intake:AppState.intake||{}, payment:AppState.payment||{} })); window.location.href='report/report.html'; }); }

  // Camera events
  const cap=document.getElementById('btnCapture'); if(cap){ cap.addEventListener('click',()=> LuneCamera.capture()); }
  const up=document.getElementById('fileUpload'); if(up){ up.addEventListener('change',e=>{
    const f=e.target.files && e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ LuneCamera.stop(); onCaptured(String(r.result)); }; r.readAsDataURL(f);
  }); }

  // Auto start: when entering Camera screen via nav
  const navCamera=document.getElementById('navCamera');
  if(navCamera){ navCamera.addEventListener('click',()=> LuneCamera.ensureStarted()); }

  // Also start when Start CTA → Camera
  const startBtn=document.getElementById('btnStart'); if(startBtn){ startBtn.addEventListener('click',()=> LuneCamera.ensureStarted()); }

  applyLocale();
})();

function applyLocale(){ const t=k=>LuneI18n.t(k); const map=[
  ['t_app_title','app_title'],['t_tagline','tagline'],['t_subtag','subtag'],['t_startCta','start_cta'],
  ['t_camera_title','camera_title'],['t_camera_hint','camera_hint'],['t_capture','capture'],['t_upload','upload'],
  ['t_quick_title','quick_title'],['t_quick_lead','quick_lead'],['t_intake_title','intake_title'],
  ['t_name','name'],['t_email','email'],['t_skinType','skin_type'],['t_goals','goals'],['t_allergies','allergies'],
  ['t_budget','budget'],['t_routinePref','routine_pref'],['t_back','back'],['t_continue','continue'],
  ['t_payment_title','payment_title'],['t_payment_hint','payment_hint'],['t_viewReport','view_report']
]; map.forEach(([id,key])=>{ const el=document.getElementById(id); if(el) el.textContent=t(key); }); }

// --- CAMERA MODULE ---
const LuneCamera = (function(){
  let stream = null;
  const video = () => document.getElementById('camVideo');
  const canvas = () => document.getElementById('camCanvas');

  function needsSecure(){
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
    return !(location.protocol === 'https:' || isLocal);
  }

  async function ensureStarted(){
    // show disclaimer first time only
    if(!localStorage.getItem('LUNE_CAM_OK')){ openDisclaimer(); return; }
    await start();
  }

  function openDisclaimer(){
    const dlg=document.getElementById('camDisclaimer');
    if(!dlg) { // no dialog in markup → just try to start
      start(); return;
    }
    dlg.removeAttribute('hidden');
    const accept=document.getElementById('camAccept');
    accept?.addEventListener('click', async ()=>{
      localStorage.setItem('LUNE_CAM_OK','1');
      dlg.setAttribute('hidden','');
      await start();
    }, { once:true });
    const cancel=document.getElementById('camCancel');
    cancel?.addEventListener('click', ()=>{ dlg.setAttribute('hidden',''); });
  }

  async function start(){
    const msg = document.getElementById('camMsg');
    if(needsSecure()){
      if(msg) msg.textContent = 'Camera requires HTTPS or localhost. Please open this page over https:// or use localhost.';
      return;
    }
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:{ideal:1280}, height:{ideal:720} }, audio:false });
      const v=video(); if(v){ v.srcObject = stream; await v.play(); }
      if(msg) msg.textContent='';
    }catch(err){
      if(msg){
        if(err && err.name==='NotAllowedError') msg.textContent='Camera permission denied. Please allow access and try again.';
        else if(err && err.name==='NotFoundError') msg.textContent='No camera device found.';
        else msg.textContent='Unable to start camera: '+(err && err.message ? err.message : String(err));
      }
    }
  }

  function stop(){ try{ if(stream){ stream.getTracks().forEach(t=>t.stop()); } }finally{ stream=null; const v=video(); if(v){ v.pause(); v.srcObject=null; } }
  }

  function capture(){
    const v=video(), c=canvas(); if(!v||!c) return;
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    c.width = w; c.height = h; const ctx=c.getContext('2d'); ctx.drawImage(v,0,0,w,h);
    const data = c.toDataURL('image/png');
    stop(); // release camera after capture
    onCaptured(data);
  }

  return { ensureStarted, start, stop, capture };
})();

function onCaptured(imageDataUrl){
  // Basic scoring mock → navigate to QuickScore and render ring
  AppState.scanMetrics = { image:imageDataUrl, texture: Math.random()*0.4+0.5, pores: Math.random()*0.4+0.3, tone: Math.random()*0.4+0.4, redness: Math.random()*0.4+0.2, shine: Math.random()*0.5, dryness: Math.random()*0.5, sensitivity: Math.random()*0.5 };
  navigateTo('screenQuickScore');
  const C = 2*Math.PI*52; // ring length
  // compute score
  const m = AppState.scanMetrics; const final=Math.round((0.30*m.texture+0.20*m.pores+0.15*m.tone+0.10*m.redness+0.10*(1-m.tone)+0.05*m.shine+0.05*m.dryness+0.05*m.sensitivity)*100);
  const ring=document.getElementById('scoreRing'); if(ring){ ring.style.strokeDasharray=String(C); ring.style.strokeDashoffset=String(C*(1-final/100)); }
  const t=k=>LuneI18n.t(k);
  const val=document.getElementById('scoreValue'); if(val) val.textContent=String(final);
  const band=document.getElementById('scoreBand'); if(band) band.textContent = final>=80?t('band_great'):final>=60?t('band_fair'):t('band_support');
}

// --- Intake (chips) ---
(function(){
  document.querySelectorAll('.chip-group .chip')?.forEach(chip=>{
    chip.addEventListener('click',()=>{
      const input=chip.querySelector('input'); if(!input) return;
      if(input.type==='checkbox'){ input.checked=!input.checked; chip.classList.toggle('selected', input.checked); }
      else { const g=chip.closest('.chip-group'); g?.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected')); input.checked=true; chip.classList.add('selected'); }
      collectIntake();
    });
  });
  ['i_name','i_email'].forEach(id=>{ const el=document.getElementById(id); el?.addEventListener('input', collectIntake); });
  function collectIntake(){
    const v=(sel)=>{ const x=document.querySelector(`input[name="${sel}"]:checked`); return x?x.value:''; };
    const arr=(sel)=> Array.from(document.querySelectorAll(`input[name="${sel}"]:checked`)).map(x=>x.value);
    AppState.intake={ name:document.getElementById('i_name')?.value?.trim()||'', email:document.getElementById('i_email')?.value?.trim()||'', skinType:v('skinType'), routinePreference:v('routinePreference'), budget:v('budget'), skinGoals:arr('skinGoals'), allergies:arr('allergies'), pregnancy:false };
  }
})();

// --- Payment (dummy) ---
(function(){
  const deep=document.getElementById('btnDeep'); deep?.addEventListener('click',()=>{ AppState.payment={ product:'Recovery Plan', amount:9.90, currency:'EUR' }; });
  const comp=document.getElementById('btnCompanion'); comp?.addEventListener('click',()=>{ AppState.payment={ product:'Premium Companion', amount:39.90, currency:'EUR' }; });
})();

function saveUserRecord(){
  const records = JSON.parse(localStorage.getItem('LUNE_USERS')||'[]');
  const entry = { timestamp:new Date().toISOString(), locale:LuneI18n.locale?.()||'en', scan:AppState.scanMetrics||{}, intake:AppState.intake||{}, payment:AppState.payment||{}, quickScore:Number(document.getElementById('scoreValue')?.textContent||0) };
  records.push(entry); localStorage.setItem('LUNE_USERS', JSON.stringify(records));
}
