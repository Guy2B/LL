/* Lune Beauty Staff Cloud Sync — Production 2026-09-02
 * Drop-in replacement for assets/js/staff-cloud-sync.js
 * Contract used by staff.html: isReady(), push(), pull(), clearOperationalData().
 * Important: this module NEVER auto-pushes on load. A stale browser cannot overwrite Cloud just by opening Staff.
 */
(function(){
  'use strict';

  const CONFIG_KEY='lune_staff_cloud_config_v1';
  const CLIENT_ID_KEY='lune_staff_cloud_client_id_v1';
  const PLACEHOLDER='PASTE_GOOGLE_APPS_SCRIPT_STAFF_CLOUD_URL_HERE';
  let busyPromise=null;

  function storage(){
    try{if(typeof safeStorage!=='undefined'&&safeStorage)return safeStorage;}catch(_){}
    return window.localStorage;
  }
  function readConfig(){
    try{return Object.assign({apiUrl:'',token:'',auto:false},JSON.parse(storage().getItem(CONFIG_KEY)||'{}'));}
    catch(_){return {apiUrl:'',token:'',auto:false};}
  }
  function saveConfig(cfg){
    const clean={
      apiUrl:String(cfg&&cfg.apiUrl||'').trim(),
      token:String(cfg&&cfg.token||'').trim(),
      auto:!!(cfg&&cfg.auto)
    };
    storage().setItem(CONFIG_KEY,JSON.stringify(clean));
    return clean;
  }
  function clientId(){
    let id='';
    try{id=storage().getItem(CLIENT_ID_KEY)||'';}catch(_){}
    if(!id){
      id='staff-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
      try{storage().setItem(CLIENT_ID_KEY,id);}catch(_){}
    }
    return id;
  }
  function isReady(){
    const c=readConfig();
    return !!(c.apiUrl&&c.apiUrl!==PLACEHOLDER&&c.token);
  }
  function assertReady(){
    const c=readConfig();
    if(!c.apiUrl||c.apiUrl===PLACEHOLDER)throw new Error('URL Apps Script manquante.');
    if(!c.token)throw new Error('Token Staff manquant.');
    return c;
  }
  function withBusy(fn){
    if(busyPromise)return busyPromise;
    busyPromise=Promise.resolve().then(fn).finally(function(){busyPromise=null;});
    return busyPromise;
  }
  function jsonp(action,params){
    const cfg=assertReady();
    return new Promise(function(resolve,reject){
      const cb='luneCloudCb_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      const q=new URLSearchParams(Object.assign({},params||{}, {
        action:action,token:cfg.token,clientId:clientId(),callback:cb,_:Date.now()
      }));
      const script=document.createElement('script');
      let done=false;
      const timer=setTimeout(function(){finish();reject(new Error('Timeout Cloud (20 s).'));},20000);
      function finish(){
        if(done)return;done=true;clearTimeout(timer);
        try{delete window[cb];}catch(_){}
        try{script.remove();}catch(_){}
      }
      window[cb]=function(data){
        finish();
        if(!data||data.ok===false)return reject(new Error(data&&data.error||'Réponse Cloud invalide.'));
        resolve(data);
      };
      script.onerror=function(){finish();reject(new Error('Cloud non joignable.'));};
      script.src=cfg.apiUrl+(cfg.apiUrl.indexOf('?')>=0?'&':'?')+q.toString();
      document.head.appendChild(script);
    });
  }
  async function post(payload){
    const cfg=assertReady();
    const body=new URLSearchParams(Object.assign({},payload||{}, {token:cfg.token,clientId:clientId()}));
    const response=await fetch(cfg.apiUrl,{method:'POST',body:body,redirect:'follow'});
    const text=await response.text();
    let data;
    try{data=JSON.parse(text);}catch(_){throw new Error('Réponse Apps Script non JSON. Vérifiez le déploiement Web App.');}
    if(!data||data.ok===false)throw new Error(data&&data.error||'Erreur Cloud.');
    return data;
  }
  function currentDb(){
    try{return window.db||db;}catch(_){return null;}
  }
  function setDb(next){
    try{db=next;window.db=next;return true;}catch(_){try{window.db=next;return true;}catch(__){return false;}}
  }
  function normalize(next){
    try{return typeof window.normalizeDb==='function'?window.normalizeDb(next):next;}catch(_){return next;}
  }
  function savePrimaryLocal(next){
    const st=storage();
    try{
      if(typeof KEY!=='undefined')st.setItem(KEY,JSON.stringify(next));
    }catch(e){console.warn('Primary local cache write skipped; Cloud state remains loaded in memory.',e);}
    try{
      if(typeof FINANCE_EXPENSES_KEY!=='undefined'&&Array.isArray(next&&next.expenses)){
        st.setItem(FINANCE_EXPENSES_KEY,JSON.stringify(next.expenses));
      }
    }catch(e){console.warn('Finance local cache write skipped.',e);}
  }
  function rerender(){
    try{if(typeof window.renderAll==='function')window.renderAll();}catch(e){console.warn(e);}
    try{if(typeof window.loadSettings==='function')window.loadSettings();}catch(_){}
    try{window.dispatchEvent(new CustomEvent('lune:cloud-db-updated',{detail:{at:new Date().toISOString()}}));}catch(_){}
  }
  async function pull(){
    return withBusy(async function(){
      const data=await jsonp('state',{});
      if(!data.state||typeof data.state!=='object')throw new Error('Le Cloud ne contient aucun état Staff exploitable.');
      const next=normalize(data.state);
      if(!setDb(next))throw new Error('Impossible de charger l’état Cloud dans Staff.');
      savePrimaryLocal(next);
      rerender();
      return {ok:true,version:data.version||'',updatedAt:data.updatedAt||'',state:next};
    });
  }
  async function push(){
    return withBusy(async function(){
      const state=currentDb();
      if(!state||typeof state!=='object')throw new Error('Aucun état Staff local à synchroniser.');
      const data=await post({action:'saveState',state:JSON.stringify(state),updatedBy:clientId()});
      return {ok:true,version:data.version||''};
    });
  }
  async function clearOperationalData(options){
    return withBusy(async function(){
      const p=Object.assign({action:'clearOperationalData',clearLogs:'yes'},options||{});
      if(typeof p.clearLogs==='boolean')p.clearLogs=p.clearLogs?'yes':'no';
      return await post(p);
    });
  }
  async function health(){
    return await jsonp('health',{});
  }

  function mountConfigUi(){
    if(document.getElementById('luneCloudProductionCard'))return;
    const admin=document.getElementById('admin');
    if(!admin)return;
    const cfg=readConfig();
    const card=document.createElement('div');
    card.id='luneCloudProductionCard';
    card.className='card';
    card.innerHTML='\
      <h2>Cloud Lune Beauty · Production</h2>\
      <p class="small">Cette connexion charge d’abord le Cloud. Aucun envoi automatique n’est fait à l’ouverture.</p>\
      <label>URL Web App Apps Script</label>\
      <input id="luneCloudProdUrl" type="url" placeholder="https://script.google.com/macros/s/.../exec">\
      <label>Token Staff</label>\
      <input id="luneCloudProdToken" type="password" autocomplete="off">\
      <div class="bookingActions" style="margin-top:10px">\
        <button class="gold" type="button" id="luneCloudProdSave">Speichern & testen</button>\
        <button class="secondary" type="button" id="luneCloudProdPull">Cloud importieren</button>\
        <button class="secondary" type="button" id="luneCloudProdPush">Aktuellen Stand sichern</button>\
      </div>\
      <div id="luneCloudProdStatus" class="statusNote small"></div>';
    const first=admin.querySelector('.card');
    if(first)admin.insertBefore(card,first);else admin.prepend(card);
    const u=card.querySelector('#luneCloudProdUrl'),t=card.querySelector('#luneCloudProdToken'),s=card.querySelector('#luneCloudProdStatus');
    u.value=cfg.apiUrl||'';t.value=cfg.token||'';
    function status(msg,bad){s.textContent=msg;s.style.color=bad?'#b83227':'#166534';}
    card.querySelector('#luneCloudProdSave').onclick=async function(){
      saveConfig({apiUrl:u.value,token:t.value,auto:false});
      try{const h=await health();status('✓ Cloud connecté · '+(h.apiVersion||'API OK')+' · '+(h.updatedAt||''),false);}
      catch(e){status('Connexion échouée : '+(e.message||e),true);}
    };
    card.querySelector('#luneCloudProdPull').onclick=async function(){
      try{status('Import Cloud…',false);const r=await pull();const d=currentDb()||{};status('✓ Importé · '+((d.customers||[]).length)+' clientes · '+((d.bookings||[]).length)+' RDV',false);}
      catch(e){status('Import échoué : '+(e.message||e),true);}
    };
    card.querySelector('#luneCloudProdPush').onclick=async function(){
      if(!confirm('Envoyer maintenant l’état affiché de ce Staff vers le Cloud ?'))return;
      try{status('Sauvegarde Cloud…',false);await push();status('✓ Sauvegarde Cloud terminée.',false);}
      catch(e){status('Sauvegarde refusée/échouée : '+(e.message||e),true);}
    };
  }

  window.LuneStaffCloudSync={
    version:'2026-09-02-production-v1',
    isReady:isReady,
    readConfig:readConfig,
    saveConfig:saveConfig,
    health:health,
    pull:pull,
    push:push,
    clearOperationalData:clearOperationalData
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountConfigUi,{once:true});else setTimeout(mountConfigUi,0);
})();
