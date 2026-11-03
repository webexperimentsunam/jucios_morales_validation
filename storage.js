/* Persistencia independiente de ExpBuilder. El servidor debe autorizar el experimentID y uid originales. */
(() => {
  'use strict';
  const EXPERIMENT_ID = 'e9493936-a5e7-4970-8759-520d2b4689d0';
  const OWNER_UID = 'C71v82VCu8YE7lyNhr02UmB8g5k1';
  const API_BASE = 'https://us-central1-test-e4cf9.cloudfunctions.net';
  const DATABASE_NAME = 'validacion-rebuild-v1';
  const LOCAL_KEY = 'active';
  const FB_CONFIG = {
    apiKey: 'AIzaSyBQSjlsGoxGo78qWwbQBrNfL3-CKsoUnMY',
    authDomain: 'test-e4cf9.firebaseapp.com',
    databaseURL: 'https://test-e4cf9-default-rtdb.firebaseio.com',
    projectId: 'test-e4cf9',
    storageBucket: 'test-e4cf9.firebasestorage.app',
    messagingSenderId: '414213417080',
    appId: '1:414213417080:web:285e5fc5e2fbebd656e58d'
  };

  class LocalStore {
    constructor(){ this.db=null; this.queue=Promise.resolve(); }
    async init(){
      if (this.db) return;
      this.db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(DATABASE_NAME,1);
        req.onupgradeneeded=()=>{ if (!req.result.objectStoreNames.contains('sessions')) req.result.createObjectStore('sessions'); };
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
    }
    async read(){
      await this.init();
      return new Promise((resolve,reject)=>{
        const t=this.db.transaction('sessions','readonly');
        const r=t.objectStore('sessions').get(LOCAL_KEY);
        r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);
      });
    }
    write(snapshot){
      const data=structuredClone(snapshot);
      this.queue=this.queue.catch(()=>{}).then(async()=>{
        await this.init();
        await new Promise((resolve,reject)=>{
          const t=this.db.transaction('sessions','readwrite');
          t.objectStore('sessions').put(data,LOCAL_KEY);
          t.oncomplete=resolve;t.onerror=()=>reject(t.error);
        });
      });
      return this.queue;
    }
    async clear(){
      await this.queue;
      await this.init();
      return new Promise((resolve,reject)=>{
        const t=this.db.transaction('sessions','readwrite');
        t.objectStore('sessions').delete(LOCAL_KEY);
        t.oncomplete=resolve;t.onerror=()=>reject(t.error);
      });
    }
    async flush(){await this.queue;}
  }

  const store=new LocalStore();
  function metadata(){
    return {
      browser: navigator.userAgent.includes('Edg/')?'Edge':navigator.userAgent.includes('Chrome/')?'Chrome':navigator.userAgent.includes('Firefox/')?'Firefox':'Other',
      browserVersion: (navigator.userAgent.match(/(?:Edg|Chrome|Firefox)\/(\d+[.\d]*)/)||[])[1]||'',
      os:/Windows/.test(navigator.userAgent)?'Windows':/Android/.test(navigator.userAgent)?'Android':/iPhone|iPad/.test(navigator.userAgent)?'iOS':/Macintosh/.test(navigator.userAgent)?'macOS':'Other',
      screenResolution:`${screen.width}x${screen.height}`,language:navigator.language,startedAt:new Date().toISOString()
    };
  }
  function emptySnapshot(demo){
    return {
      experimentID:EXPERIMENT_ID,version:4,
      sessionId:crypto.randomUUID(),participantNumber:null,demo:!!demo,
      rows:[], savedRemote:false,remoteState:'not-started',
      createdAt:new Date().toISOString(),metadata:metadata(),
      progress:{welcomeDone:false,consentPage:1,consentResult:'pending',introDone:false,surveyDone:false,instructionsDone:false,prePracticeDone:false,practiceDone:0,postPracticeDone:false,mainDone:0,finalDone:false},
      practiceOrder:null,mainOrder:null
    };
  }
  async function jsonPost(url,data){
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data),cache:'no-store'});
    let result;
    const text=await res.text();
    try{result=JSON.parse(text);}catch{result={message:text.slice(0,400)};}
    if(!res.ok||result.success!==true){throw Error(`HTTP ${res.status}: ${String(result.message||result.error||text||'Sin confirmación').slice(0,400)}`);}
    return result;
  }
  async function createRemoteSession(snapshot){
    if(snapshot.demo) {snapshot.participantNumber=0;snapshot.remoteState='demo';return {success:true,participantNumber:0};}
    if(snapshot.remoteState==='registered'&&snapshot.participantNumber!=null){
      if(!dbRef)await connectRealtime(snapshot).catch(err=>{
        snapshot.firebaseStatus=String(err.message||err);
        console.warn('No se logró recuperar la conexión de estado de Firebase:',err);
      });
      return {success:true,participantNumber:snapshot.participantNumber};
    }
    const result=await jsonPost(`${API_BASE}/apiData`,{
      experimentID:EXPERIMENT_ID,sessionId:snapshot.sessionId,uid:OWNER_UID,batchSize:0
    });
    if(typeof result.participantNumber!=='number')throw Error('La API no devolvió participantNumber.');
    snapshot.participantNumber=result.participantNumber;
    snapshot.remoteState='registered';
    await store.write(snapshot);
    await connectRealtime(snapshot).catch((err)=>{
      snapshot.firebaseStatus=String(err.message||err);
      console.warn('Firebase Realtime Database no autorizó estado de sesión:',err);
    });
    return result;
  }
  let dbRef=null;
  async function connectRealtime(snapshot){
    if(snapshot.demo) return;
    if(!window.firebase||!window.firebase.database)throw Error('SDK de Firebase no disponible');
    if(!window.firebase.apps.length)window.firebase.initializeApp(FB_CONFIG);
    const db=window.firebase.database();
    dbRef=db.ref(`sessions/${EXPERIMENT_ID}/${snapshot.sessionId}`);
    await dbRef.update({
      connected:true,experimentID:EXPERIMENT_ID,
      sessionId:snapshot.sessionId,participantNumber:snapshot.participantNumber,
      state:'in-progress',storage:'googledrive',storageProvider:'googledrive',
      lastUpdate:window.firebase.database.ServerValue.TIMESTAMP,
      metadata:snapshot.metadata
    });
    await dbRef.onDisconnect().update({connected:false,state:'disconnected',disconnectedAt:window.firebase.database.ServerValue.TIMESTAMP});
    snapshot.firebaseStatus='connected';
  }
  async function saveRemote(snapshot){
    await store.flush();
    if(snapshot.demo) {snapshot.savedRemote=false;return {success:true,demo:true};}
    if(snapshot.remoteState!=='registered')await createRemoteSession(snapshot);
    if(!snapshot.rows.length)throw Error('No hay datos para enviar.');
    const m=snapshot.metadata;
    const trialsWithMetadata=snapshot.rows.map(r=>({
      ...r,experimentID:EXPERIMENT_ID,sessionId:snapshot.sessionId,
      session_id:snapshot.sessionId,
      session_browser:m.browser,session_browser_version:m.browserVersion,session_os:m.os,
      session_screen_resolution:m.screenResolution,session_language:m.language,
      session_started_at:m.startedAt
    }));
    const result=await jsonPost(`${API_BASE}/apiDataComplete`,{
      experimentID:EXPERIMENT_ID,
      sessionId:snapshot.sessionId,
      trialsData:trialsWithMetadata,
      storage:'googledrive'
    });
    snapshot.savedRemote=true;
    snapshot.savedAt=new Date().toISOString();
    await store.write(snapshot);
    if(dbRef){
      try{
        await dbRef.update({connected:false,finished:true,needsFinalization:false,state:'completed',finishedAt:window.firebase.database.ServerValue.TIMESTAMP,lastUpdate:window.firebase.database.ServerValue.TIMESTAMP});
        await dbRef.onDisconnect().cancel();
      }catch(e){ console.warn('Los datos fueron aceptados por la API, pero Firebase RTDB no confirmó el estado:',e);snapshot.firebaseStatus='completion-failed';await store.write(snapshot); }
    }
    return result;
  }
  function downloadJson(snapshot){
    const safe={...snapshot,metadata:{...snapshot.metadata},rows:snapshot.rows};
    const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`validacion_${snapshot.sessionId}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  window.ValidacionStorage={EXPERIMENT_ID,store,emptySnapshot,createRemoteSession,saveRemote,downloadJson};
})();
