

  // --- FileUploadResponseComponent endpoint (Firebase Cloud Function) ---
  window.JSPSYCH_FILE_UPLOAD_ENDPOINT = 'https://us-central1-test-e4cf9.cloudfunctions.net/apiData'.replace('/apiData', '/uploadParticipantFile');
  window.JSPSYCH_EXPERIMENT_ID = '7f4f984c-de8c-47f4-8144-b6284a011f97';

  // --- Almacenamiento en memoria para la sesión actual (sin IndexedDB) ---
  // Los registros se transmiten a la API después de cada ensayo. La memoria
  // permite conservar el envío final a Drive sin acceder a IndexedDB.
  // La memoria se pierde si se cierra o recarga la página; por ello deben
  // confirmarse las escrituras remotas y posteriormente activar Cloudflare.
  const TrialDB = (() => {
    const rows = [];
    let nextId = 1;
    return {
      async init() { return null; },
      async add(trial) {
        const id = nextId++;
        rows.push({ ...trial, id, sessionId: trialSessionId,
          timestamp: Date.now(), createdAt: Date.now() });
        return id;
      },
      async getAll() { return rows.slice(); },
      async count() { return rows.length; },
      async getN(n) { return rows.slice(0, n); },
      async deleteN(n) { return rows.splice(0, n).length; },
      async clear() { rows.length = 0; }
    };
  })();

  // --- Recolectar metadata del sistema ---
  const getMetadata = () => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }
    
    let osName = 'Unknown';
    if (ua.indexOf('Win') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) osName = 'macOS';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('iOS') > -1) osName = 'iOS';
    
    return {
      browser: browserName,
      browserVersion: browserVersion,
      os: osName,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      language: navigator.language,
      userAgent: ua,
      startedAt: new Date().toISOString()
    };
  };
  
  const metadata = getMetadata();

  // --- Firebase config ---
  const firebaseConfig = {
    apiKey: "AIzaSyBQSjlsGoxGo78qWwbQBrNfL3-CKsoUnMY",
    authDomain: "test-e4cf9.firebaseapp.com",
    databaseURL: "https://test-e4cf9-default-rtdb.firebaseio.com",
    projectId: "test-e4cf9",
    storageBucket: "test-e4cf9.firebasestorage.app",
    messagingSenderId: "414213417080",
    appId: "1:414213417080:web:285e5fc5e2fbebd656e58d"
  };

  // --- Cargar Firebase SDK ---
  if (typeof window.firebase === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
    script.onload = () => {
      const dbScript = document.createElement('script');
      dbScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
      dbScript.onload = () => { window._firebaseReady = true; };
      document.head.appendChild(dbScript);
    };
    document.head.appendChild(script);
  } else {
    window._firebaseReady = true;
  }

  function waitForFirebase() {
    return new Promise(resolve => {
      if (window._firebaseReady) return resolve();
      const interval = setInterval(() => {
        if (window._firebaseReady) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

 
  const Uid = "C71v82VCu8YE7lyNhr02UmB8g5k1";

  // TEST SHORTCUT: add ?prueba=3 to exercise all screens with three main trials.
  // Regular URL executes the original full experiment.
  const VALIDACION_PRUEBA_ACTIVA = new URLSearchParams(window.location.search).get('prueba') === '3';
  const VALIDACION_PRUEBA_VERSION = 'v9-prueba3-1';
  window.ValidacionPrueba = {
    version: VALIDACION_PRUEBA_VERSION,
    activa: VALIDACION_PRUEBA_ACTIVA,
    practica: 3,
    principal: null,
    limitePrincipal: VALIDACION_PRUEBA_ACTIVA ? 3 : null,
    get sessionId() { return window.JSPSYCH_SESSION_ID || null; }
  };
  if (VALIDACION_PRUEBA_ACTIVA) {
    document.title = '[PRUEBA 3] Validación — Experimento';
    console.info('[Validación] MODO PRUEBA: 3 ensayos de práctica y 3 del bloque principal. Datos marcados como prueba.');
  }

  const _publicStorageKeys = {"sessionId":"expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:session-id","participant":"expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:participant-number","captchaPassed":"expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:captcha-passed","resumeTrial":"expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:resume-trial","trialDatabase":"expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:trials-v1"};

  
  
  {
    const readBranchRuleValue = function fF(n,e){let t=e.column||"";if(!t&&e.componentIdx&&e.prop?t=`${e.componentIdx}_${e.prop}`:!t&&e.prop&&(t=e.prop),!t)return;if(n[t]!==void 0)return n[t];const r=t.split("_");if(r.length<2)return;const i=r[r.length-1],s=`${r.slice(0,-1).join("_")}_response`,a=n[s];if(!(!a||typeof a!="object"||Array.isArray(a)))return a[i]};
const compareBranchValue = function pF(n,e){if(Array.isArray(n)){const s=n.includes(e.value)||n.includes(String(e.value));return e.op==="=="?s:e.op==="!="?!s:!1}const t=Number.parseFloat(String(n)),r=Number.parseFloat(String(e.value)),i=!Number.isNaN(t)&&!Number.isNaN(r);switch(e.op){case"==":return i?t===r:String(n)===String(e.value);case"!=":return i?t!==r:String(n)!==String(e.value);case">":return i&&t>r;case"<":return i&&t<r;case">=":return i&&t>=r;case"<=":return i&&t<=r;default:return!1}};
const evaluateBranchCondition = function ehe(n,e){return Array.isArray(e.rules)?e.rules.every(t=>{const r=fF(n,t);return r!==void 0&&pF(r,t)}):!1};
const findLatestTrialData = function the(n,e){for(let t=n.length-1;t>=0;t-=1){const r=n[t];if([r.builder_id,r.trial_id,r.loop_id].some(s=>String(s)===String(e)))return r}return null};
const evaluateReferencedCondition = function g9e(n,e){return Array.isArray(e.rules)?e.rules.every(t=>{if(t.trialId===null||t.trialId===void 0)return!1;const r=the(n,t.trialId);if(!r)return!1;const i=fF(r,t);return i!==void 0&&pF(i,t)}):!1};
const decideBranch = function m9e(n,e,t,r){const i=s=>{if(s!=null&&s!=="FINISH_EXPERIMENT"&&!e.some(a=>String(a)===String(s)))throw new Error("Branch destination has no configured connection")};i(r);for(const s of t)if(i(s.nextTrialId),!!ehe(n,s))return{targetId:s.nextTrialId??null,conditionId:s.id??null,customParameters:s.customParameters??null,usedDefault:!1};return{targetId:r,conditionId:null,customParameters:null,usedDefault:!0}};
const fF = readBranchRuleValue;
const pF = compareBranchValue;
const ehe = evaluateBranchCondition;
const the = findLatestTrialData;
const g9e = evaluateReferencedCondition;
const m9e = decideBranch;
    window.ExpBuilderBranching = {
      readRuleValue: readBranchRuleValue,
      compareValue: compareBranchValue,
      evaluateCondition: evaluateBranchCondition,
      evaluateReferencedCondition: evaluateReferencedCondition,
      decide: decideBranch
    };
  }
  
  
  (() => {
    const pendingOperations = new Set();
    const idleWaiters = new Set();

    const notifyIfIdle = () => {
      if (pendingOperations.size > 0) return;
      for (const resolve of idleWaiters) resolve();
      idleWaiters.clear();
    };
    const start = () => {
      const token = Object.freeze({});
      pendingOperations.add(token);
      return token;
    };
    const finish = token => {
      pendingOperations.delete(token);
      notifyIfIdle();
    };

    window.ExpBuilderPersistence = Object.freeze({
      start,
      finish,
      track(operation) {
        const token = start();
        Promise.resolve(operation).then(
          () => finish(token),
          () => finish(token)
        );
        return operation;
      },
      pendingCount() {
        return pendingOperations.size;
      },
      async whenIdle() {
        while (pendingOperations.size > 0) {
          await new Promise(resolve => idleWaiters.add(resolve));
        }
      }
    });
  })();

  
  (() => {
    const RESUME_TRIAL_KEY = "expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:resume-trial";
    let pendingBranch = null;
    let deferredResume = null;

    const normalizeId = value => value == null ? null : String(value);
    const emit = (type, payload) => window.ExpBuilderRuntime?.emit(type, payload || {});
    const currentManifest = () => {
      const manifest = window.ExpBuilderExecutionAddresses;
      return manifest?.version === 3 ? manifest : null;
    };
    const resolveAddress = targetId =>
      currentManifest()?.addressesByTarget?.[normalizeId(targetId)] ?? null;
    const validateResume = decision => {
      const manifest = currentManifest();
      const finished = decision.targetId === "FINISH_EXPERIMENT";
      const address = finished ? { enterLoopIds: [] } : resolveAddress(decision.targetId);
      if (!manifest || !address || decision.experimentRevision !== manifest.revision) {
        throw new Error('The saved navigation does not match this experiment revision');
      }
      if (address.enterLoopIds.length < decision.loops.length ||
          decision.loops.some((frame, index) => address.enterLoopIds[index] !== frame.loopId)) {
        throw new Error('The saved navigation has an invalid loop path');
      }
      const validateQueue = (state, ownerId) => {
        if (!state || !Array.isArray(state.entries) || !Number.isInteger(state.index) ||
            state.index < 0 || state.index > state.entries.length) {
          throw new Error('The saved timeline cursor is invalid');
        }
        for (const entry of state.entries) {
          if (resolveAddress(entry.id)?.targetOwnerId !== ownerId ||
              (entry.targetId && !resolveAddress(entry.targetId))) {
            throw new Error('The saved timeline destination is invalid');
          }
        }
      };
      validateQueue(decision.globalRouting.nativeTimeline, null);
      if (finished && decision.globalRouting.nativeTimeline.index !== decision.globalRouting.nativeTimeline.entries.length) {
        throw new Error('A finished route cannot contain future entries');
      }
      for (const frame of decision.loops) validateQueue(frame.routing.nativeTimeline, frame.loopId);
    };
    const acknowledgeBranch = data => {
      const request = pendingBranch;
      if (!request || request.acknowledged ||
          String(data?.builder_id ?? data?.trial_id) !== String(request.source.builder_id ?? request.source.trial_id) ||
          data?.trial_index !== request.source.trial_index) return;
      request.acknowledged = true;
      Promise.resolve().then(() => window.ExpBuilderPersistence?.whenIdle?.()).then(() => {
        if (pendingBranch !== request) return;
        pendingBranch = null;
        emit('branch-persisted', { targetId: request.targetId });
        nativeRuntime.resumeExperiment();
      }).catch(error => window.ExpBuilderRuntime?.reportError(error, { source: 'branch-persistence-barrier' }));
    };


    const loopFrames = [];
    const preparedLoops = new Map();
    let restoredLoops = new Map();
    let cursorCheckpointsEnabled = false;
    const cloneResumeValue = value => JSON.parse(JSON.stringify(value));
    const globalRouteSnapshot = () => ({ nativeTimeline: nativeRootSnapshot() });
    const loopSnapshots = () => loopFrames.map(frame => ({
      loopId: frame.loopId,
      order: frame.order,
      cursor: frame.cursor,
      repetition: frame.repetition,
      cycleRows: frame.cycleRows,
      routing: frame.readRouting()
    }));
    const cursorCheckpoint = (targetId, completed, afterCompleted) => ({
      version: 3,
      experimentRevision: currentManifest()?.revision ?? null,
      completed,
      cursor: {
        targetId: String(targetId),
        afterCompleted,
        loops: loopSnapshots(),
        globalRouting: globalRouteSnapshot()
      }
    });
    const restoreCursor = decision => {
      if (decision.kind !== 'cursor') return;
      restoredLoops = new Map(decision.loops.map(frame => [frame.loopId, frame]));
      cursorCheckpointsEnabled = true;
    };
    const sampleLoop = (loopId, indices, randomize, conditional) => {
      const key = String(loopId);
      let frame = preparedLoops.get(key);
      if (!frame || !frame.active) {
        const saved = restoredLoops.get(key);
        restoredLoops.delete(key);
        if (saved && (saved.order.some(index => !indices.includes(index)) ||
            saved.order.length !== indices.length)) {
          throw new Error('The saved loop order does not match its stimuli');
        }
        frame = {
          loopId: key,
          repetition: saved?.repetition ?? 0,
          cursor: saved?.cursor ?? 0,
          order: saved?.order ?? null,
          cycleRows: saved?.cycleRows ?? [],
          savedRouting: saved?.routing ?? null,
          conditional,
          repeatCycle: false
        };
        preparedLoops.set(key, frame);
      } else {
        if (!frame.repeatCycle) frame.repetition++;
        frame.cursor = 0;
        frame.order = null;
        frame.cycleRows = [];
        frame.repeatCycle = false;
      }
      if (!frame.order) {
        frame.order = indices.slice();
        if (randomize) {
          for (let index = frame.order.length - 1; index > 0; index--) {
            const other = Math.floor(Math.random() * (index + 1));
            [frame.order[index], frame.order[other]] =
              [frame.order[other], frame.order[index]];
          }
        }
      }
      return frame.order.slice(frame.cursor);
    };
    const remainingLoopRepetitions = (loopId, repetitions) =>
      Math.max(0, repetitions - (restoredLoops.get(String(loopId))?.repetition ?? 0));
    const startLoop = (loopId, readRouting, writeRouting) => {
      const key = String(loopId);
      const frame = preparedLoops.get(key);
      if (!frame) throw new Error('The loop has no sampled execution order');
      frame.readRouting = readRouting;
      frame.active = true;
      if (frame.savedRouting) writeRouting(frame.savedRouting);
      frame.savedRouting = null;
      loopFrames.push(frame);
      cursorCheckpointsEnabled = true;
    };
    const finishLoop = loopId => {
      const key = String(loopId);
      const index = loopFrames.findIndex(frame => frame.loopId === key);
      if (index !== -1) loopFrames.splice(index);
      preparedLoops.delete(key);
    };
    const finishLoopRow = loopId => {
      const frame = preparedLoops.get(String(loopId));
      if (frame) frame.cursor++;
    };
    const finishLoopCycle = (loopId, shouldRepeat) => {
      const frame = preparedLoops.get(String(loopId));
      if (frame) frame.repeatCycle = Boolean(shouldRepeat);
    };
    const loopResults = loopId =>
      preparedLoops.get(String(loopId))?.cycleRows ?? null;
    const checkpointTrialStart = trialData => {
      if (!cursorCheckpointsEnabled) return;
      nativeTransition = null;
      const targetId = trialData?.builder_id ?? trialData?.trial_id;
      if (targetId === undefined || targetId === null) return;
      let previous = null;
      try {
        previous = JSON.parse(localStorage.getItem(RESUME_TRIAL_KEY) || 'null');
      } catch (_error) { /* A new valid cursor replaces a damaged checkpoint. */ }
      localStorage.setItem(RESUME_TRIAL_KEY, JSON.stringify(cursorCheckpoint(
        targetId, previous?.completed ?? null, false
      )));
    };
    const checkpointTrialComplete = (data, fallback) => {
      if (!cursorCheckpointsEnabled) return fallback;
      for (const frame of loopFrames) {
        if (frame.conditional) frame.cycleRows.push(cloneResumeValue(data));
      }
      const transition = transitionCheckpoint(data, fallback);
      if (transition) return transition;
      return cursorCheckpoint(
        data.builder_id ?? data.trial_id,
        fallback.completed,
        true
      );
    };


    const definitions = new Map();
    const nativeScopes = [];
    const branchDecisions = new WeakMap();
    let nativeRuntime = null;
    let nativeSerial = 0;
    let nativeResume = null;
    let resumeArrived = false;
    let skippedCompletedTarget = false;
    let nativeTransition = null;
    let checkpointNextFrame = null;
    let selectedPreview = false;
    const scopeKey = id => id === null ? 'root' : String(id);
    const scopeSnapshot = scope => ({
      entries: cloneResumeValue(scope.entries), index: scope.index + (checkpointNextFrame === scope ? 1 : 0),
      deferred: scope.deferred || null
    });
    const nativeRootSnapshot = () => nativeScopes.length
      ? scopeSnapshot(nativeScopes[0]) : null;
    const normalEntries = id => {
      const entry = currentManifest()?.entries?.[scopeKey(id)];
      return entry == null ? [] : [{ id: String(entry) }];
    };
    const routeEntries = (ownerId, targetId, options = {}) => {
      const address = resolveAddress(targetId);
      if (!address) throw new Error('Navigation target has no compiled execution address');
      const path = address.enterLoopIds;
      const ownerIndex = ownerId === null ? -1 : path.indexOf(ownerId);
      if (ownerId !== null && ownerIndex < 0) throw new Error('Target is outside the retained scope');
      const entryId = path[ownerIndex + 1] ?? String(targetId);
      const entry = {
        id: entryId, targetId: entryId === String(targetId) ? null : String(targetId),
        parameterTarget: String(targetId), parameters: options.parameters ?? null
      };
      const entries = [entry];
      return entries;
    };
    const replaceFuture = (scope, entries) => {
      // Never move or remove an entry at/before the native iterator's cursor.
      scope.entries.splice(scope.index + 1, scope.entries.length, ...entries);
      scope.queue.splice(scope.index + 1, scope.queue.length,
        ...entries.map(entry => makeEntry(scope, entry)));
    };
    const closeNativeScopes = index => {
      const exited = nativeScopes.splice(index);
      for (const scope of exited) {
        preparedLoops.delete(scope.id);
        restoredLoops.delete(scope.id);
      }
      const frameIndex = loopFrames.findIndex(frame => exited.some(scope => scope.id === frame.loopId));
      if (frameIndex !== -1) loopFrames.splice(frameIndex);
      return exited;
    };
    const performTransition = (targetId, options = {}) => {
      if (targetId === 'FINISH_EXPERIMENT') {
        const root = nativeScopes[0];
        replaceFuture(root, []);
        if (nativeScopes.length > 1) {
          const name = nativeScopes[1].name;
          closeNativeScopes(1);
          nativeRuntime.abortTimelineByName(name);
        }
        return root;
      }
      const address = resolveAddress(targetId);
      if (!address) throw new Error('Navigation target has no compiled execution address');
      let commonIndex = 0;
      for (let index = 1; index < nativeScopes.length; index++) {
        if (nativeScopes[index].id !== address.enterLoopIds[index - 1]) break;
        commonIndex = index;
      }
      const common = nativeScopes[commonIndex];
      if (!common) throw new Error('There is no active native timeline');
      replaceFuture(common, routeEntries(common.id, String(targetId), options));
      if (nativeScopes.length > commonIndex + 1) {
        const name = nativeScopes[commonIndex + 1].name;
        // Aborted timelines do not run on_timeline_finish: clean their state now.
        closeNativeScopes(commonIndex + 1);
        nativeRuntime.abortTimelineByName(name);
      }
      emit('navigation-transition', { targetId: String(targetId), retainedScope: common.id });
      return common;
    };
    const deferOrdinaryExit = (sourceId, targetId, options) => {
      const frame = nativeScopes[nativeScopes.length - 1];
      const address = resolveAddress(targetId);
      if (!frame || frame.id === null || !options.usedDefault || !address ||
          address.enterLoopIds.includes(frame.id)) return false;
      frame.deferred = { targetId: String(targetId), options };
      replaceFuture(frame, []);
      return true;
    };
    const requestBranch = (data, decision) => {
      branchDecisions.set(data, decision);
      let targetId = decision.targetId;
      if (selectedPreview && targetId != null && targetId !== 'FINISH_EXPERIMENT' && !resolveAddress(targetId)) targetId = null;
      const frame = nativeScopes[nativeScopes.length - 1];
      if (!frame) return;
      const sourceId = data.builder_id ?? data.trial_id ?? null;
      if (targetId == null) {
        replaceFuture(frame, []);
      } else {
        if (targetId !== 'FINISH_EXPERIMENT' && resolveAddress(targetId)?.targetKind !== 'trial') {
          throw new Error('Branch destination must be a compiled trial');
        }
        const options = { parameters: decision.customParameters ?? null,
          usedDefault: Boolean(decision.usedDefault && decision.conditionId == null) };
        emit('branch-decision', { sourceId, targetId, conditionId: decision.conditionId ?? null,
          usedDefault: options.usedDefault });
        if (!deferOrdinaryExit(sourceId, targetId, options)) {
          const retained = performTransition(targetId, options);
          nativeTransition = retained ? { source: data, targetId, frame: retained } : null;
        }
      }
      // on_finish must return so on_data_update can durably acknowledge this result.
      pendingBranch = { source: data, targetId, acknowledged: false };
      nativeRuntime.pauseExperiment();
    };
    const takeParameters = targetId => {
      for (let index = nativeScopes.length - 1; index >= 0; index--) {
        const entry = nativeScopes[index].current;
        if (entry?.parameterTarget === String(targetId) && entry.parameters) {
          const parameters = entry.parameters;
          for (const scope of nativeScopes) {
            if (scope.current?.parameterTarget === String(targetId)) scope.current.parameters = null;
          }
          return parameters;
        }
      }
      return null;
    };
    function makeEntry(scope, entry) {
      const definition = definitions.get(entry.id);
      if (!definition) throw new Error('Missing compiled timeline definition: ' + entry.id);
      const node = definition.kind === 'loop' ? makeLoop(entry, definition.node) : definition.node;
      return {
        timeline: [node],
        on_timeline_start() {
          scope.index = scope.entries.indexOf(entry);
          scope.current = entry;
          if (nativeResume && !resumeArrived && entry.id === String(nativeResume.targetId)) {
            resumeArrived = true;
            emit('resume-target-enter', { targetId: resolveAddress(entry.id)?.targetId });
          } else if (entry.parameterTarget === entry.id) {
            emit('branch-target-enter', { targetId: resolveAddress(entry.id)?.targetId });
          }
        },
        conditional_function() {
          if (nativeResume?.afterCompleted && !skippedCompletedTarget &&
              entry.id === String(nativeResume.targetId)) {
            skippedCompletedTarget = true;
            scope.index = scope.entries.indexOf(entry);
            scope.current = entry;
            return false;
          }
          return true;
        }
      };
    }
    function makeLoop(entry, definition) {
      const id = entry.id;
      const name = 'expbuilder-loop-' + id + '-' + (++nativeSerial);
      let scope;
      let savedRow = null;
      let firstRow = true;
      const row = {
        timeline: [],
        on_timeline_start() {
          scope.deferred = null;
          let entries;
          if (firstRow && savedRow) {
            entries = savedRow.entries.slice(savedRow.index);
            scope.deferred = savedRow.deferred;
          } else if (firstRow && entry.targetId) {
            entries = routeEntries(id, entry.targetId, { ...entry, parameters: entry.parameters });
          } else entries = normalEntries(id);
          firstRow = false;
          scope.index = -1;
          scope.entries = entries;
          scope.queue = row.timeline;
          row.timeline.splice(0, row.timeline.length, ...entries.map(item => makeEntry(scope, item)));
        },
        on_timeline_finish() { finishLoopRow(id); }
      };
      return {
        ...definition, name, timeline: [row],
        on_timeline_start() {
          scope = { id, name, entries: [], queue: row.timeline, index: -1, deferred: null };
          nativeScopes.push(scope);
          startLoop(id, () => ({ nativeTimeline: scopeSnapshot(scope) }), state => {
            savedRow = state.nativeTimeline ?? null;
          });
          definition.on_timeline_start?.();
        },
        on_timeline_finish() {
          const deferred = scope.deferred;
          const index = nativeScopes.indexOf(scope);
          if (index !== -1) nativeScopes.splice(index);
          finishLoop(id);
          definition.on_timeline_finish?.();
          if (deferred &&
              !deferOrdinaryExit(id, deferred.targetId, deferred.options)) {
            performTransition(deferred.targetId, deferred.options);
          } else if (!deferred) {
            const next = currentManifest()?.loopContinuations?.[id];
            const parent = nativeScopes[nativeScopes.length - 1];
            if (parent && next != null) replaceFuture(parent, [{ id: String(next) }]);
          }
        }
      };
    }
    const registerTrial = (id, node) => definitions.set(String(id), { kind: 'trial', node });
    const registerLoop = (id, node, metadata) => definitions.set(String(id), { kind: 'loop', node, metadata });
    const attach = (jsPsych, timeline) => {
      if (!definitions.size) return;
      if (!currentManifest()?.scopes) throw new Error('Unsupported execution manifest');
      nativeRuntime = jsPsych;
      nativeResume = deferredResume;
      if (nativeResume) validateResume(nativeResume);
      skippedCompletedTarget = false;
      resumeArrived = false;
      const savedRoot = nativeResume?.globalRouting.nativeTimeline;
      const entries = savedRoot ? savedRoot.entries.slice(savedRoot.index) : normalEntries(null);
      const root = { id: null, name: 'expbuilder-root', entries, queue: [], index: -1 };
      root.queue = entries.map(entry => makeEntry(root, entry));
      const authored = new Set([...definitions.values()].map(item => item.node));
      const setup = timeline.filter(node => !authored.has(node));
      timeline.splice(0, timeline.length, ...setup, {
        name: root.name, timeline: root.queue,
        on_timeline_start() { nativeScopes.push(root); cursorCheckpointsEnabled = true; }
      });
    };
    
    const attachPreview = (jsPsych, timeline) => {
      const idsByNode = new Map([...definitions].map(([id, definition]) => [definition.node, id]));
      const scopes = { root: [] };
      const entries = { root: null };
      const loopContinuations = {};
      const addressesByTarget = {};
      const visit = (id, ownerId, path) => {
        if (addressesByTarget[id]) throw new Error('Preview item has multiple owners');
        const definition = definitions.get(id);
        addressesByTarget[id] = { targetId: id, targetKind: definition.kind, targetOwnerId: ownerId, enterLoopIds: path };
        scopes[scopeKey(ownerId)].push(id);
        if (definition.kind === 'loop') {
          scopes[id] = [];
          entries[id] = definition.metadata?.entryItemId == null ? null : String(definition.metadata.entryItemId);
          loopContinuations[id] = definition.metadata?.nextItemId == null ? null : String(definition.metadata.nextItemId);
          for (const child of definition.node.timeline) {
            const childId = idsByNode.get(child);
            if (childId) visit(childId, id, [...path, id]);
          }
        }
      };
      for (const node of timeline) {
        const id = idsByNode.get(node);
        if (id) visit(id, null, []);
      }
      entries.root = scopes.root[0] ?? null;
      window.ExpBuilderExecutionAddresses = {
        version: 3, entries, loopContinuations, revision: 'selected-preview', nextBySource: {}, scopes, allScopes: scopes, addressesByTarget
      };
      selectedPreview = true;
      attach(jsPsych, timeline);
    };

    const transitionCheckpoint = (data, fallback) => {
      if (!nativeTransition || nativeTransition.source !== data) return null;
      checkpointNextFrame = nativeTransition.frame;
      try {
        return cursorCheckpoint(nativeTransition.targetId, fallback.completed, false);
      } finally {
        checkpointNextFrame = null;
      }
    };

    window.ExpBuilderNavigation = Object.freeze({
      registerTrial, registerLoop, attach, attachPreview, requestBranch,
      takeParameters, decisionFor: data => branchDecisions.get(data),
      sampleLoop, remainingLoopRepetitions, startLoop, finishLoop,
      finishLoopRow, finishLoopCycle, loopResults,
      checkpointTrialStart, checkpointTrialComplete,
      activateResume(decision) {
        if (decision?.kind !== "cursor" || decision.targetId == null || deferredResume || pendingBranch) return false;
        restoreCursor(decision);
        deferredResume = { ...decision, targetId: String(decision.targetId) };
        return true;
      },
      onTrialPersisted(data) { acknowledgeBranch(data); },
      isTransitionPending() { return pendingBranch !== null; },
      clearTransientState() {
        nativeScopes.length = 0;
        nativeTransition = null;
        loopFrames.length = 0;
        preparedLoops.clear();
        restoredLoops.clear();
        cursorCheckpointsEnabled = false;
        pendingBranch = null;
        deferredResume = null;
        localStorage.removeItem(RESUME_TRIAL_KEY);
      }
    });
  })();

  function _createResumeCheckpoint(trialData) {
    const data = trialData || {};
    const checkpoint = {
      completed: {
        builderId: data.builder_id ?? data.trial_id ?? null,
        trialIndex: data.trial_index ?? null
      }
    };
    return window.ExpBuilderNavigation.checkpointTrialComplete(data, checkpoint);
  }
  function _resolveResumeBranch(resumeRaw) {
    if (!resumeRaw) return null;
    try {
      const d = JSON.parse(resumeRaw);
      if (d.version === 3) {
        const cursor = d.cursor;
        if (typeof d.experimentRevision !== 'string' || !d.experimentRevision ||
            !cursor || cursor.targetId === undefined || cursor.targetId === null ||
            !Array.isArray(cursor.loops) || !cursor.globalRouting ||
            cursor.loops.some(frame => typeof frame.loopId !== 'string' ||
              !Array.isArray(frame.order) || frame.order.length === 0 ||
              frame.order.some(index => !Number.isInteger(index) || index < 0) ||
              new Set(frame.order).size !== frame.order.length ||
              !Number.isInteger(frame.cursor) || frame.cursor < 0 ||
              frame.cursor >= frame.order.length ||
              !Number.isInteger(frame.repetition) || frame.repetition < 0 ||
              !Array.isArray(frame.cycleRows) || !frame.routing)) return null;
        return {
          kind: 'cursor',
          sourceId: d.completed?.builderId ?? null,
          targetId: String(cursor.targetId),
          experimentRevision: d.experimentRevision,
          afterCompleted: Boolean(cursor.afterCompleted),
          loops: cursor.loops,
          globalRouting: cursor.globalRouting
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }


  // --- Session Name Configuration ---
  const _SESSION_NAME_TOKENS = [];
  const _SESSION_NAME_SEPARATOR = "_";
  function _generateSessionName(participantNumber) {
    if (!_SESSION_NAME_TOKENS || _SESSION_NAME_TOKENS.length === 0) return null;
    const _now = new Date();
    const _pad = (n, len) => String(n).padStart(len != null ? len : 2, '0');
    const _y = _now.getFullYear();
    const _mo = _pad(_now.getMonth() + 1);
    const _d = _pad(_now.getDate());
    const _h = _pad(_now.getHours());
    const _mi = _pad(_now.getMinutes());
    const _s = _pad(_now.getSeconds());
    const _parts = _SESSION_NAME_TOKENS.map(function(_token) {
      switch (_token.type) {
        case 'date': {
          if (_token.dateFormat === 'YYYYMMDD') return _y + '' + _mo + _d;
          if (_token.dateFormat === 'DD-MM-YYYY') return _d + '-' + _mo + '-' + _y;
          if (_token.dateFormat === 'MM-DD-YYYY') return _mo + '-' + _d + '-' + _y;
          return _y + '-' + _mo + '-' + _d;
        }
        case 'time': {
          if (_token.timeFormat === 'HH-mm') return _h + '-' + _mi;
          if (_token.timeFormat === 'HHmmss') return _h + '' + _mi + _s;
          return _h + '-' + _mi + '-' + _s;
        }
        case 'randomAlpha': {
          const _chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          return Array.from({ length: _token.randomLength || 6 }, function() {
            return _chars[Math.floor(Math.random() * _chars.length)];
          }).join('');
        }
        case 'customText': return _token.customValue || '';
        case 'counter': {
          if (participantNumber == null) return '__CNT__';
          return _pad(participantNumber, _token.counterDigits || 3);
        }
        default: return '';
      }
    }).filter(function(p) { return p !== ''; });
    const _hasUnique = _SESSION_NAME_TOKENS.some(function(t) { return t.type === 'randomAlpha' || t.type === 'counter'; });
    if (!_hasUnique && _parts.length > 0) {
      const _rc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      _parts.push(Array.from({ length: 6 }, function() { return _rc[Math.floor(Math.random() * _rc.length)]; }).join(''));
    }
    return _parts.length > 0 ? _parts.join(_SESSION_NAME_SEPARATOR) : null;
  }
  function _sessionNameHasDynamic() {
    return _SESSION_NAME_TOKENS.some(function(t) { return t.type === 'counter'; });
  }

  // Recuperar sessionId de localStorage o crear uno nuevo
  // Evitar que una sesión piloto reanude accidentalmente una sesión de producción,
  // o viceversa. Se recomienda iniciar en una ventana de incógnito nueva.
  const _pilotStorageKey = _publicStorageKeys.sessionId + ':pilot-mode';
  const _existingSession = localStorage.getItem(_publicStorageKeys.sessionId);
  const _existingPilotMode = localStorage.getItem(_pilotStorageKey) === '3';
  if (_existingSession && _existingPilotMode !== VALIDACION_PRUEBA_ACTIVA) {
    throw new Error('Hay una sesión iniciada en el modo opuesto. Usa una ventana de incógnito nueva para probar y conserva los datos pendientes de la sesión anterior.');
  }
  if (!_existingSession) {
    if (VALIDACION_PRUEBA_ACTIVA) localStorage.setItem(_pilotStorageKey, '3');
    else localStorage.removeItem(_pilotStorageKey);
  }
  let trialSessionId = localStorage.getItem(_publicStorageKeys.sessionId);
  let storedParticipantNumber = localStorage.getItem(_publicStorageKeys.participant);
  let isResuming = false;
  
  if (!trialSessionId) {
    // If there are counter tokens, use UUID as initial ID (counter needs participantNumber).
    // Otherwise use the generated name directly.
    if (_sessionNameHasDynamic()) {
      trialSessionId = (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10));
    } else {
      trialSessionId = _generateSessionName(null) || (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10));
    }
  } else {
    isResuming = true;
  }

  // Set JSPSYCH_SESSION_ID immediately so file uploads always have the current sessionId
  window.JSPSYCH_SESSION_ID = trialSessionId;

  let participantNumber;

  async function createSession() {
    try {
      const _preSessionName = !_sessionNameHasDynamic() ? _generateSessionName(null) : null;
      const res = await fetch("https://us-central1-test-e4cf9.cloudfunctions.net/apiData", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "*/*" },
        body: JSON.stringify({
          experimentID: "7f4f984c-de8c-47f4-8144-b6284a011f97",
          sessionId: trialSessionId,
          uid: Uid,
          batchSize: 1,
          ...(_preSessionName
            ? { sessionName: (VALIDACION_PRUEBA_ACTIVA ? 'PRUEBA3-' : '') + _preSessionName }
            : (VALIDACION_PRUEBA_ACTIVA ? { sessionName: 'PRUEBA3-' + trialSessionId } : {}))
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error creating session:', errorText);
        throw new Error(`Failed to create session: ${res.status} - ${errorText}`);
      }
      
      const result = await res.json();
      console.log('Session created:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create session');
      }
      
      return result.participantNumber;
    } catch (error) {
      console.error('Error in createSession:', error);
      alert('Error creating session: ' + error.message);
      throw error;
    }
  }

  async function _updateSessionName(sessionId, sessionName) {
    try {
      await fetch("https://us-central1-test-e4cf9.cloudfunctions.net/apiData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSessionName", experimentID: "7f4f984c-de8c-47f4-8144-b6284a011f97", sessionId, sessionName }),
      });
    } catch (e) {}
  }

  
  // --- Loading overlay ---
  // Read body background at runtime to match canvas styles injected via <style>
  const _bgColor = (getComputedStyle(document.body).backgroundColor || '').trim();
  const _overlayBg = _bgColor && _bgColor !== 'rgba(0, 0, 0, 0)' && _bgColor !== 'transparent' ? _bgColor : '#fff';
  const _loadingOverlay = document.createElement('div');
  _loadingOverlay.id = 'jspsych-loading-overlay';
  _loadingOverlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center',
    'background:' + _overlayBg, 'gap:20px',
    'font-family:sans-serif'
  ].join(';');
  _loadingOverlay.innerHTML = `
    <div style="width:48px;height:48px;border:5px solid #e0e0e0;border-top-color:#555;border-radius:50%;animation:_spin 0.8s linear infinite"></div>
    <p id="jspsych-loading-msg" style="margin:0;color:#555;font-size:15px">Preparando el experimento…</p>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(_loadingOverlay);

  function _setLoadingMsg(msg) {
    const el = document.getElementById('jspsych-loading-msg');
    if (el) el.textContent = msg;
  }

  function _hideLoading() {
    const el = document.getElementById('jspsych-loading-overlay');
    if (el) el.remove();
  }

  function _clearCompletedTrialVisuals() {
    [
      'jspsych-dynamic-visual-bridge',
      'jspsych-dynamic-persistent-visual'
    ].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function _showSuccess() {
    _hideLoading();
    _clearCompletedTrialVisuals();
    const overlay = document.createElement('div');
    overlay.id = 'jspsych-loading-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:' + _overlayBg, 'gap:16px',
      'font-family:sans-serif'
    ].join(';');
    overlay.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="#22c55e"/>
        <polyline points="18,33 28,43 46,22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p style="margin:0;color:#111;font-size:18px;font-weight:600">Experimento completado. ¡Gracias!</p>
      <p style="margin:0;color:#555;font-size:14px">Ya puedes cerrar esta ventana.</p>
    `;
    document.body.appendChild(overlay);
  }

  function _showLoading(msg) {
    _hideLoading();
    const overlay = document.createElement('div');
    overlay.id = 'jspsych-loading-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:' + _overlayBg, 'gap:20px',
      'font-family:sans-serif'
    ].join(';');
    overlay.innerHTML = `
      <div style="width:48px;height:48px;border:5px solid #e0e0e0;border-top-color:#555;border-radius:50%;animation:_spin 0.8s linear infinite"></div>
      <p id="jspsych-loading-msg" style="margin:0;color:#555;font-size:15px">${msg || 'Espera un momento…'}</p>
      <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(overlay);
  }

  
  // --- CAPTCHA gate (hCaptcha or reCAPTCHA v2) ---
  function _showCaptchaGate(siteKey, provider) {
    return new Promise((resolve) => {
      provider = provider || 'hcaptcha';

      // Read body background at call time to match canvas styles
      const _bgColor = (getComputedStyle(document.body).backgroundColor || '').trim();
      const _captchaBg = _bgColor && _bgColor !== 'rgba(0, 0, 0, 0)' && _bgColor !== 'transparent' ? _bgColor : '#fff';

      // Load the appropriate script once
      if (!document.getElementById('captcha-script')) {
        const s = document.createElement('script');
        s.id = 'captcha-script';
        s.async = true;
        s.defer = true;
        window._captchaReady = function() { window._captchaAPIReady = true; };
        if (provider === 'recaptcha') {
          s.src = 'https://www.google.com/recaptcha/api.js?render=explicit&onload=_captchaReady';
        } else {
          s.src = 'https://js.hcaptcha.com/1/api.js?onload=_captchaReady&render=explicit';
        }
        document.head.appendChild(s);
      }

      // Build overlay
      const overlay = document.createElement('div');
      overlay.id = 'jspsych-captcha-overlay';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:10000',
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'background:' + _captchaBg, 'gap:24px',
        'font-family:sans-serif'
      ].join(';');
      overlay.innerHTML = `
        <p style="margin:0;color:#333;font-size:17px;font-weight:600">
          Please verify you are human
        </p>
        <div id="captcha-widget"></div>
      `;
      document.body.appendChild(overlay);

      function _renderWidget() {
        if (provider === 'recaptcha') {
          if (typeof grecaptcha === 'undefined' || !window._captchaAPIReady) {
            setTimeout(_renderWidget, 100);
            return;
          }
          grecaptcha.render('captcha-widget', {
            sitekey: siteKey,
            theme: 'light',
            callback: function(token) {
              const el = document.getElementById('jspsych-captcha-overlay');
              if (el) el.remove();
              resolve(token);
            },
            'error-callback': function() { grecaptcha.reset(); }
          });
        } else {
          // hCaptcha
          if (typeof hcaptcha === 'undefined' || !window._captchaAPIReady) {
            setTimeout(_renderWidget, 100);
            return;
          }
          hcaptcha.render('captcha-widget', {
            sitekey: siteKey,
            theme: 'light',
            callback: function(token) {
              const el = document.getElementById('jspsych-captcha-overlay');
              if (el) el.remove();
              resolve(token);
            },
            'error-callback': function() { hcaptcha.reset(); }
          });
        }
      }

      _renderWidget();
    });
  }


  (async () => {
    // --- CAPTCHA gate (hCaptcha / reCAPTCHA) ---
    if (false && "" && !sessionStorage.getItem(_publicStorageKeys.captchaPassed)) {
      const _loadingEl = document.getElementById('jspsych-loading-overlay');
      if (_loadingEl) _loadingEl.style.display = 'none';
      await _showCaptchaGate("", "hcaptcha");
      sessionStorage.setItem(_publicStorageKeys.captchaPassed, '1');
      if (_loadingEl) _loadingEl.style.display = 'flex';
      _setLoadingMsg('Creando sesión…');
    }


    const resumeRaw = localStorage.getItem("expbuilder:public:7f4f984c-de8c-47f4-8144-b6284a011f97:resume-trial");
    const resumeRouteDecision = isResuming && resumeRaw ? _resolveResumeBranch(resumeRaw) : null;
    if (isResuming && resumeRaw && !resumeRouteDecision) throw new Error('The saved navigation checkpoint is invalid');
  
    
    // --- Configuración de Batching (cargada desde Firestore) ---
    const BATCH_CONFIG = {
      size: 1,
      currentBatchNumber: 0,
      resumeTimeoutMinutes: 1,
      useIndexedDB: false
    };

    // Inicializar IndexedDB solo si está habilitado
    if (BATCH_CONFIG.useIndexedDB) {
      await TrialDB.init();
    }
    
    // Recuperación de la sesión y del progreso confirmado de los envíos.
    // No se borran registros previos de manera automática.
    let resumedSession = false;
    const BATCH_ACK_KEY = `expbuilder:public:${window.JSPSYCH_EXPERIMENT_ID}:batch-ack-v2`;
    let batchAck = { sessionId: trialSessionId, lastAckId: 0, batchNumber: 0 };
    try {
      const previous = JSON.parse(localStorage.getItem(BATCH_ACK_KEY) || 'null');
      if (BATCH_CONFIG.useIndexedDB && previous && previous.sessionId === trialSessionId) {
        batchAck = {
          sessionId: trialSessionId,
          lastAckId: Number(previous.lastAckId) || 0,
          batchNumber: Number(previous.batchNumber) || 0
        };
      }
    } catch (_) { /* Un estado dañado no borra los datos en IndexedDB. */ }
    BATCH_CONFIG.currentBatchNumber = batchAck.batchNumber;
    if (BATCH_CONFIG.useIndexedDB) {
      const existingTrials = await TrialDB.getAll();
      if (existingTrials.length > 0) {
        resumedSession = existingTrials.some(row => row.sessionId === trialSessionId);
        if (existingTrials.some(row => row.sessionId !== trialSessionId)) {
          throw new Error('Hay respuestas de otra sesión en este navegador. No se borraron. ' +
            'Recupéralas antes de iniciar una sesión diferente.');
        }
      }
    }

    if (isResuming && !BATCH_CONFIG.useIndexedDB) {
      // Esta modalidad no puede reconstruir ensayos anteriores tras recargar la pagina.
      // Evitar consolidar un CSV parcial como si fuera una sesion completa.
      throw new Error('Existe una sesión anterior, pero el modo sin IndexedDB no permite reconstruir sus respuestas tras recargar. Conserva esa pestaña para revisión y abre una sesión NUEVA en una ventana de incógnito. No borres datos de una sesión real sin exportarlos primero.');
    }

    // SIEMPRE llamar a createSession (para crear documento en Firestore)
    // El backend maneja sesiones duplicadas (409) y las retorna correctamente
    _setLoadingMsg('Creando sesión…');
    participantNumber = await createSession();

    // If session name has counter token, generate final name now that participantNumber is known
    if (_sessionNameHasDynamic() && typeof participantNumber === 'number' && !isNaN(participantNumber)) {
      const _finalName = _generateSessionName(participantNumber);
      if (_finalName) {
        // Session IDs are durable identities. The generated name is display metadata.
        _updateSessionName(trialSessionId, (VALIDACION_PRUEBA_ACTIVA ? 'PRUEBA3-' : '') + _finalName);
      }
    }

    // Guardar sessionId y participantNumber en localStorage para futuras retomas
    localStorage.setItem(_publicStorageKeys.sessionId, trialSessionId);
    localStorage.setItem(_publicStorageKeys.participant, participantNumber.toString());

    if (typeof participantNumber !== "number" || isNaN(participantNumber)) {
      alert("No se pudo asignar el número de participante. Intenta nuevamente.");
      throw new Error("participantNumber not assigned");
    }
    
    // Esperar e inicializar Firebase
    _setLoadingMsg('Cargando recursos…');
    await waitForFirebase();
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    const db = window.firebase.database();

    // --- Configurar onDisconnect para finalizar sesión automáticamente ---
    const sessionRef = db.ref('sessions/7f4f984c-de8c-47f4-8144-b6284a011f97/' + trialSessionId);
    // update, no set: al reanudar NO borrar respuestas guardadas en la sesion.
    await sessionRef.update({
      connected: true,
      experimentID: '7f4f984c-de8c-47f4-8144-b6284a011f97',
      sessionId: trialSessionId,
      participantNumber: participantNumber,
      startedAt: window.firebase.database.ServerValue.TIMESTAMP,
      storage: 'googledrive',
      storageProvider: 'googledrive',
      state: resumedSession ? 'resumed' : 'initiated',
      lastUpdate: window.firebase.database.ServerValue.TIMESTAMP,
      metadata: metadata,
      resumeTimeoutMinutes: BATCH_CONFIG.resumeTimeoutMinutes,
      useIndexedDB: BATCH_CONFIG.useIndexedDB
    });
    
    sessionRef.onDisconnect().update({
      connected: false,
      state: 'disconnected',
      disconnectedAt: window.firebase.database.ServerValue.TIMESTAMP,
      storage: 'googledrive'
    });

    const evaluateCondition = window.ExpBuilderBranching.evaluateCondition;

    if (resumeRouteDecision !== null) {
      window.ExpBuilderNavigation.activateResume(resumeRouteDecision);
      window.ExpBuilderRuntime?.emit('resume-route-activated', resumeRouteDecision);
    }
  

    _hideLoading();

    // --- Recruitment platform URL params (using URLSearchParams - available before initJsPsych) ---
    const _urlParams = new URLSearchParams(window.location.search);
    const _prolificPID = _urlParams.get('PROLIFIC_PID');
    const _prolificStudyID = _urlParams.get('STUDY_ID');
    const _prolificSessionID = _urlParams.get('SESSION_ID');
    const _mturkWorkerID = _urlParams.get('workerId');
    const _mturkAssignmentID = _urlParams.get('assignmentId');
    const _mturkHitID = _urlParams.get('hitId');
    const _mturkTurkSubmitTo = _urlParams.get('turkSubmitTo');
    const _mturkIsPreview = _mturkAssignmentID === 'ASSIGNMENT_ID_NOT_AVAILABLE';

    

    // Guardado incremental: 1 ensayo por envio con cola en memoria (sin IndexedDB).
    // El ACK de apiData confirma recepcion por la API, no necesariamente que
    // Google Drive ya haya creado/actualizado el CSV.
    // apiDataComplete al terminar consolida la sesion y valida el archivo final.
    let batchQueue = Promise.resolve();
    let lastBatchError = null;
    const PERSIST_ID = window.JSPSYCH_EXPERIMENT_ID;
    const BATCH_ENDPOINT = 'https://us-central1-test-e4cf9.cloudfunctions.net/apiData';

    // Guardado remoto adicional: cada respuesta queda en Realtime Database
    // independientemente de la consolidacion final del CSV en Google Drive.
    // Los permisos reales dependen de las reglas del servidor Firebase; comprobarlos.
    const checkpointRef = sessionRef.child('trial_checkpoints');
    let checkpointQueue = Promise.resolve();
    let lastCheckpointError = null;
    let checkpointConfirmed = 0;
    let lastCheckpointAck = null;
    const failedCheckpoints = new Map();
    function checkpointKey(row) {
      if (!Number.isSafeInteger(row.id) || row.id <= 0) throw new Error('La respuesta no tiene id local valido');
      return 'r' + String(row.id).padStart(7, '0');
    }
    async function saveCheckpoint(row) {
      const key = checkpointKey(row);
      const payload = { ...JSON.parse(JSON.stringify(row)), sessionId: trialSessionId,
        experimentID: PERSIST_ID, checkpointVersion: 1,
        savedAt: window.firebase.database.ServerValue.TIMESTAMP };
      // Establecer un ID estable por registro: un reintento sobreescribe ese
      // registro y no crea respuestas duplicadas.
      await checkpointRef.child(key).set(payload);
      failedCheckpoints.delete(key);
      checkpointConfirmed++;
      lastCheckpointAck = { key, trialIndex: row.trial_index,
        at: new Date().toISOString() };
      lastCheckpointError = null;
    }
    function queueCheckpoint(row) {
      const key = checkpointKey(row);
      const promise = checkpointQueue.then(() => saveCheckpoint(row));
      checkpointQueue = promise.catch(err => {
        failedCheckpoints.set(key, row);
        lastCheckpointError = err.message || String(err);
        console.warn('[Juicios morales] Respaldo Firebase pendiente:', key, lastCheckpointError);
      });
      return promise;
    }
    // Reenviar las respuestas existentes al reanudar es seguro porque cada
    // registro conserva su clave estable (set en lugar de push).
    if (resumedSession) {
      (await TrialDB.getAll()).filter(row => row.sessionId === trialSessionId)
        .forEach(row => { void queueCheckpoint(row).catch(() => {}); });
    }
    async function drainCheckpoints() {
      await checkpointQueue;
      // Un reintento al finalizar sin perder la copia local.
      for (const row of Array.from(failedCheckpoints.values())) {
        try { await queueCheckpoint(row); }
        catch (_) { /* Drive completo es la segunda via de recuperacion. */ }
      }
      await checkpointQueue;
    }
    window.JuiciosCheckpointDiagnostics = {
      version:'11.0', path: 'sessions/' + PERSIST_ID + '/' + trialSessionId + '/trial_checkpoints',
      get firebaseConfirmed() { return checkpointConfirmed; },
      get firebasePending() { return failedCheckpoints.size; },
      get lastFirebaseAck() { return lastCheckpointAck; },
      get lastFirebaseError() { return lastCheckpointError; },
      reintentar: drainCheckpoints,
    };


    // Verificación desde la sesión piloto sin acceso a Firebase Console.
    // Lectura de un checkpoint PROPIO: si no hay permiso de lectura, eso no
    // implica que la escritura haya fallado. No abre ni cambia reglas.
    window.JuiciosVerificacionRemota = {
      version: '12.0',
      async estado() {
        return {
          experimentID: PERSIST_ID,
          apiConfirmadas: batchAck.batchNumber,
          firebaseConfirmadas: checkpointConfirmed,
          firebasePendientes: failedCheckpoints.size,
          firebaseError: lastCheckpointError,
          ultimaConfirmada: lastCheckpointAck ? { key: lastCheckpointAck.key, trialIndex: lastCheckpointAck.trialIndex } : null,
          registrosLocales: (await TrialDB.getAll()).filter(x => x.sessionId === trialSessionId).length,
          lecturaNoVerificada: true
        };
      },
      async verificar() {
        await checkpointQueue;
        if (!lastCheckpointAck) return { estado: 'sin_escritura_confirmada',
          explicacion: 'Aún no hay checkpoints confirmados por Firebase.' };
        try {
          const snap = await checkpointRef.child(lastCheckpointAck.key).once('value');
          const value = snap.val();
          const ok = value && value.sessionId === trialSessionId &&
            value.experimentID === PERSIST_ID &&
            ('r'+String(value.id).padStart(7,'0')) === lastCheckpointAck.key;
          return {
            estado: ok ? 'lectura_remota_verificada' : 'lectura_no_coincide',
            clave: lastCheckpointAck.key,
            explicacion: ok ? 'El servidor devolvió la última respuesta almacenada.' :
              'El servidor no devolvió el checkpoint esperado.'
          };
        } catch (error) {
          return { estado: 'lectura_no_disponible',
            explicacion: 'La API de lectura falló o no está autorizada; esto no invalida una confirmación de escritura.',
            detalle: error?.message || String(error) };
        }
      },
      exportarRespaldo: () => window.ValidacionBatchDiagnostics.exportLocalCopy()
    };

    // Envio incremental, una solicitud apiData por ensayo terminado.
    // El backend recibe el mismo formato de trial utilizado por el modo
    // original sin IndexedDB. La copia local NO se borra al recibir el ACK.
    let lastRemoteAck = null;
    async function sendBatchConcatenated(trials, batchNumber) {
      if (trials.length !== 1) throw new Error('El modo por ensayo requiere exactamente un registro.');
      const row = trials[0];
      const payload = {
        ...row,
        sessionId: trialSessionId,
        experimentID: PERSIST_ID,
        clientTrialKey: `${trialSessionId}:${row.id}`,
        envio_incremental: true,
        numero_envio: batchNumber
      };
      const response = await fetch(BATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        body: JSON.stringify({
          experimentID: PERSIST_ID,
          sessionId: trialSessionId,
          data: payload,
          storage: 'googledrive'
        })
      });
      if (!response.ok) {
        throw new Error(`El ensayo ${row.trial_index ?? row.id} recibió HTTP ${response.status}: ${await response.text()}`);
      }
      const result = await response.json();
      if (result?.success !== true) {
        throw new Error(`La API no confirmó el ensayo ${row.trial_index ?? row.id}: ${result?.message || 'sin confirmación'}`);
      }
      lastRemoteAck = {
        localId: row.id, trialIndex: row.trial_index ?? null,
        time: new Date().toISOString(), sessionId: trialSessionId
      };
      return result;
    }

    async function doFlushBatches(includePartial = false) {
      for (;;) {
        const all = await TrialDB.getAll();
        const unsent = all.filter(row => row.sessionId === trialSessionId && row.id > batchAck.lastAckId);
        if (unsent.length < BATCH_CONFIG.size && !includePartial) break;
        if (unsent.length === 0) break;
        const batch = unsent.slice(0, BATCH_CONFIG.size);
        const number = batchAck.batchNumber + 1;
        await sendBatchConcatenated(batch, number);
        // Confirmar el cursor después del HTTP y del success: true.
        // Si se interrumpe justo aquí, un reintento puede reenviar el mismo lote;
        // por ello se conservan su número e índices para depuración en el servidor.
        batchAck = { sessionId: trialSessionId, lastAckId: batch[batch.length-1].id,
          batchNumber: number };
        BATCH_CONFIG.currentBatchNumber = number;
        if (BATCH_CONFIG.useIndexedDB) localStorage.setItem(BATCH_ACK_KEY, JSON.stringify(batchAck));
        lastBatchError = null;
        window.ValidacionBatchDiagnostics && (window.ValidacionBatchDiagnostics.lastError = null);
        console.info(`[Juicios morales] Ensayo ${batch[0].trial_index ?? batch[0].id} confirmado por apiData (${number}).`);
      }
    }

    function flushBatches(includePartial = false) {
      const operation = batchQueue.then(() => doFlushBatches(includePartial));
      // La cola continúa operativa si un envío anterior falló. La promesa original
      // sigue rechazándose para que el llamador pueda presentar una advertencia.
      batchQueue = operation.catch(() => {});
      return operation;
    }

    window.ValidacionBatchDiagnostics = {
      batchSize: BATCH_CONFIG.size,
      useIndexedDB: BATCH_CONFIG.useIndexedDB,
      resumeTimeoutMinutes: BATCH_CONFIG.resumeTimeoutMinutes,
      get sessionNameConfig() { return _SESSION_NAME_TOKENS.map(x => ({...x})); },
      experimentID: PERSIST_ID,
      backendExperiment: 'jucios_morales_validation',
      get lastRemoteAck() { return lastRemoteAck; },
      get apiConfirmed() { return batchAck.batchNumber; },
      get sessionId() { return trialSessionId; },
      get confirmedBatches() { return batchAck.batchNumber; },
      get lastConfirmedLocalId() { return batchAck.lastAckId; },
      lastError: null,
      async localCount() { return (await TrialDB.getAll()).length; },
      async unsentCount() { return (await TrialDB.getAll()).filter(row =>
        row.sessionId === trialSessionId && row.id > batchAck.lastAckId).length; },
      async exportLocalCopy() {
        const rows = (await TrialDB.getAll()).filter(row => row.sessionId === trialSessionId);
        const blob = new Blob([JSON.stringify({ experimentID: PERSIST_ID, sessionId: trialSessionId,
          exportedAt: new Date().toISOString(), rows }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `jucios-morales-respaldo-${trialSessionId}.json`;
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return rows.length;
      }
    };

    // Función para enviar experimento completo directo al storage
    async function sendCompleteExperiment(trials) {
      if (trials.length === 0) return;
      
      console.log(`Sending complete experiment with ${trials.length} trials directly to storage`);
      
      // Agregar metadata a cada trial
      const trialsWithMetadata = trials.map(trial => ({
        ...trial,
        session_browser: metadata.browser || "",
        session_browser_version: metadata.browserVersion || "",
        session_os: metadata.os || "",
        session_screen_resolution: metadata.screenResolution || "",
        session_language: metadata.language || "",
        session_started_at: metadata.startedAt || "",
        session_id: trialSessionId,
      }));
      
      // Enviar trials como JSON - el backend los convertirá a CSV
      const apiBaseUrl = "https://us-central1-test-e4cf9.cloudfunctions.net/apiData".replace('/apiData', '');
      return fetch(`${apiBaseUrl}/apiDataComplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "*/*" },
        body: JSON.stringify({
          experimentID: "7f4f984c-de8c-47f4-8144-b6284a011f97",
          sessionId: trialSessionId,
          trialsData: trialsWithMetadata,
          storage: "googledrive",
        }),
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            console.warn('Error sending complete experiment:', text);
            throw new Error(text);
          });
        }
        return res.json();
      })
      .then(result => {
        if (!result || result.success !== true) {
          throw new Error('Backend did not confirm complete result upload');
        }
        console.log('Complete experiment sent successfully to storage');
        return result;
      })
      .catch(error => {
        console.warn('Error in sendCompleteExperiment:', error);
        throw error;
      });
    }

    // Reintento manual y descarga cuando falla el guardado remoto.
    // La memoria NO persiste al cerrar o recargar la pestaña.
    function showSaveRecovery(error, retry) {
      _hideLoading();
      document.getElementById('validacion-save-recovery')?.remove();
      const panel = document.createElement('div');
      panel.id = 'validacion-save-recovery';
      panel.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#f4f7f6;' +
        'display:flex;align-items:center;justify-content:center;padding:18px;font:16px system-ui,sans-serif;color:#17282b';
      panel.innerHTML = `<section style="width:min(100%,560px);background:#fff;border:1px solid #bdcdcc;` +
        `border-radius:14px;padding:24px;box-shadow:0 10px 30px #0001">` +
        `<h2 style="margin:0 0 12px;font-size:22px">Guardado pendiente</h2>` +
        `<p>Las respuestas permanecen temporalmente en la memoria de esta pestaña, ` +
        `pero el servidor no ha confirmado el guardado final. Si cierras o recargas ` +
        `esta página, puedes perderlas. Descarga una copia antes de salir.</p>` +
        `<p id="validacion-save-detail" style="color:#85462c;font-size:13px;overflow-wrap:anywhere"></p>` +
        `<div style="display:flex;gap:12px;flex-wrap:wrap">` +
        `<button id="validacion-save-retry" style="padding:12px;cursor:pointer">Reintentar guardado</button>` +
        `<button id="validacion-save-backup" style="padding:12px;cursor:pointer">Descargar respaldo JSON</button>` +
        `</div></section>`;
      document.body.appendChild(panel);
      panel.querySelector('#validacion-save-detail').textContent = error?.message || String(error);
      panel.querySelector('#validacion-save-backup').onclick = () =>
        window.ValidacionBatchDiagnostics.exportLocalCopy().catch(e => {
          panel.querySelector('#validacion-save-detail').textContent = 'No se pudo exportar: ' + e.message;
        });
      panel.querySelector('#validacion-save-retry').onclick = async () => {
        const btn = panel.querySelector('#validacion-save-retry');
        btn.disabled = true;
        panel.querySelector('#validacion-save-detail').textContent = 'Reintentando…';
        panel.remove();
        await retry();
      };
    }

    async function finishSave() {
      _showLoading('Guardando respuestas…');
      try {
        // jsPsych no espera los callbacks async de on_data_update por sí mismo.
        // La navegación de ExpBuilder registra las operaciones pendientes.
        await window.ExpBuilderPersistence.whenIdle();
        await drainCheckpoints();
        await flushBatches(true);
        _setLoadingMsg('Confirmando el archivo final…');
        const allRows = (await TrialDB.getAll()).filter(row => row.sessionId === trialSessionId);
        if (!allRows.length) throw new Error('No se encontraron registros locales para finalizar.');
        await sendCompleteExperiment(allRows);
        // No solicitar agregación adicional de los lotes: apiDataComplete ya confirma
        // una copia de la sesión completa (evita finalización duplicada).
        _setLoadingMsg('Cerrando sesión…');
        await sessionRef.update({
          connected: false, finished: true, needsFinalization: false,
          state: 'completed',
          finishedAt: window.firebase.database.ServerValue.TIMESTAMP,
          lastUpdate: window.firebase.database.ServerValue.TIMESTAMP
        });
        sessionRef.onDisconnect().cancel();
        await TrialDB.clear();
        localStorage.removeItem(BATCH_ACK_KEY);
        window.ExpBuilderNavigation.clearTransientState();
        localStorage.removeItem(_publicStorageKeys.sessionId);
        if (VALIDACION_PRUEBA_ACTIVA) localStorage.removeItem(_pilotStorageKey);
        localStorage.removeItem(_publicStorageKeys.participant);
        sessionStorage.removeItem(_publicStorageKeys.captchaPassed);
        document.getElementById('validacion-save-recovery')?.remove();
        _showSuccess();
      } catch (error) {
        // El runtime guard de ExpBuilder trata console.error como error fatal.
        // Los fallos de red se comunican al usuario sin ocultar el botón de respaldo.
        console.warn('[Validación] Guardado remoto pendiente:', error);
        lastBatchError = error.message;
        if (window.ValidacionBatchDiagnostics) window.ValidacionBatchDiagnostics.lastError = error.message;
        showSaveRecovery(error, finishSave);
      }
    }

    // Clean up stale jsPsych wrappers from previous runs (prevents stacking on restarts)
    document.querySelectorAll('.jspsych-content-wrapper').forEach(el => el.remove());

    // __INIT_JSPSYCH_START__
    const jsPsych = initJsPsych({
      


      on_trial_start: function(trial) {
        window.ExpBuilderNavigation.checkpointTrialStart(trial?.data ?? {});
        const lastTrialData = jsPsych.data.get().last(1).values()[0];
        if (lastTrialData && trial.data) {
          trial.data.prev_response = lastTrialData.response;
        }
      },

      

      on_data_update: async function (data) {
        const persistenceToken = window.ExpBuilderPersistence.start();
        try {

        // Agregar timestamp del cliente para ordenamiento correcto
        data.clientTimestamp = Date.now();
        data.sessionId = trialSessionId;
        data.experimentID = "7f4f984c-de8c-47f4-8144-b6284a011f97";
        data.version_experimento = "jucios_morales_validation-v13.2";
        if (VALIDACION_PRUEBA_ACTIVA) {
          data.modo_prueba = true;
          data.version_parche_prueba = VALIDACION_PRUEBA_VERSION;
          data.limite_ensayos_principales = 3;
        }
        if (data.builder_id !== undefined && data.builder_id !== null) {
          localStorage.setItem(
            _publicStorageKeys.resumeTrial,
            JSON.stringify(_createResumeCheckpoint(data))
          );
        }

        // Actualizar estado a 'in-progress' en la primera actualización
        if (data.trial_index === 0) {
          sessionRef.update({
            state: 'in-progress',
            lastUpdate: window.firebase.database.ServerValue.TIMESTAMP
          }).catch(err => console.error('Error updating state:', err));
        }

        // Guardar en memoria y continuar sin esperar a la red; no usa IndexedDB.
        const checkpointId = await TrialDB.add(data);
        const checkpointRow = { ...data, id: checkpointId };
        // Respaldo Firebase por ensayo (sujeto a permisos de ese proyecto).
        void queueCheckpoint(checkpointRow).catch(() => {});
        window.ExpBuilderNavigation.onTrialPersisted(data);
        // Envío individual a apiData; la cola serializa solicitudes y evita
        // solapamientos cuando un participante responde rápidamente.
        const pendingCount = (await TrialDB.getAll()).filter(row =>
          row.sessionId === trialSessionId && row.id > batchAck.lastAckId).length;
        if (pendingCount >= BATCH_CONFIG.size) {
          void flushBatches(false).catch(error => {
            console.warn('[Juicios morales] El ensayo no ha sido confirmado por apiData:', error.message);
            lastBatchError = error.message;
            window.ValidacionBatchDiagnostics.lastError = error.message;
          });
        }

        
        } finally {
          window.ExpBuilderPersistence.finish(persistenceToken);
        }
      },

      on_finish: async function() {
        if (window.ExpBuilderNavigation.isTransitionPending()) {
          window.ExpBuilderRuntime?.emit('experiment-finish-suppressed', { reason: 'branching' });
          return;
        }
        await finishSave();
      }
    });
    // __INIT_JSPSYCH_END__

    // Uncomment to see the json results after finishing a session experiment
    // jsPsych.data.displayData('csv');

    

    
window.ExpBuilderExecutionAddresses = Object.freeze(
  {"version":3,"revision":"2026-11-03T15:53:14.065Z","nextBySource":{"1793294903896":"1793296406082","1793296406082":"1793300185149","1793300185149":"1793300783371","1793300783371":"1793301139332","1793301139332":"1793301815311","1793301815311":"1793302653029","1793302653029":"1793303572323","1793303572323":"1793304006966","1793304006966":"1793304388942","1793579048529":"1793642521181","1793304388942":"1793579048529","1793642521181":"1793649983720"},"addressesByTarget":{"1793294903896":{"targetId":1793294903896,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793296406082":{"targetId":1793296406082,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793300185149":{"targetId":1793300185149,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793300783371":{"targetId":1793300783371,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793301139332":{"targetId":1793301139332,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793301815311":{"targetId":1793301815311,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793301875690":{"targetId":1793301875690,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793302653029":{"targetId":1793302653029,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793303572323":{"targetId":1793303572323,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793304006966":{"targetId":1793304006966,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"loop_1793578740463":{"targetId":"loop_1793578740463","targetKind":"loop","targetOwnerId":null,"enterLoopIds":[]},"1793579048529":{"targetId":1793579048529,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"loop_1793650037960":{"targetId":"loop_1793650037960","targetKind":"loop","targetOwnerId":null,"enterLoopIds":[]},"1793649983720":{"targetId":1793649983720,"targetKind":"trial","targetOwnerId":null,"enterLoopIds":[]},"1793304388942":{"targetId":1793304388942,"targetKind":"trial","targetOwnerId":"loop_1793578740463","enterLoopIds":["loop_1793578740463"]},"1793642521181":{"targetId":1793642521181,"targetKind":"trial","targetOwnerId":"loop_1793650037960","enterLoopIds":["loop_1793650037960"]}},"entries":{"root":"1793294903896","loop_1793578740463":"1793304388942","loop_1793650037960":"1793642521181"},"loopContinuations":{"loop_1793578740463":null,"loop_1793650037960":"1793649983720"},"scopes":{"root":["1793294903896","1793296406082","1793300185149","1793300783371","1793301139332","1793301815311","1793301875690","1793302653029","1793303572323","1793304006966","loop_1793578740463","1793579048529","loop_1793650037960","1793649983720"],"loop_1793578740463":["1793304388942"],"loop_1793650037960":["1793642521181"]},"allScopes":{"root":["1793294903896","1793296406082","1793300185149","1793300783371","1793301139332","1793301815311","1793301875690","1793302653029","1793303572323","1793304006966","loop_1793578740463","1793579048529","loop_1793650037960","1793649983720"],"loop_1793578740463":["1793304388942"],"loop_1793650037960":["1793642521181"]}}
);

const timeline = [];

    const globalPreload = {
      type: jsPsychPreload,
      images: ["img/Mona.png","img/Mono.png","img/WhatsApp%20Image%202026-10-26%20at%2010.53.21.jpeg","img/WhatsApp%20Image%202026-10-26%20at%2010.53.22%20(1).jpeg","img/WhatsApp%20Image%202026-10-26%20at%2010.53.22.jpeg"],
      audio: [],
      video: []
    };
    timeline.push(globalPreload);

    // Sin pantalla completa: el experimento funciona en la ventana normal.


const test_stimuli_Bienvenida = [{components: [{ type: "ImageComponent", coordinates: {"x":-50,"y":50}, width: 15, height: 21, zIndex: 1, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.21.jpeg", name: "ImageComponent_1" }, { type: "ImageComponent", coordinates: {"x":0,"y":50}, width: 15, height: 21, zIndex: 2, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22.jpeg", name: "ImageComponent_2" }, { type: "ImageComponent", coordinates: {"x":50,"y":50}, width: 15, height: 21, zIndex: 3, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22%20(1).jpeg", name: "ImageComponent_3" }, { type: "TextComponent", coordinates: {"x":0,"y":-30}, zIndex: 4, text: "Bienvenid@!\n\nLos responsables de este proyecto de investigación\n¡Agradecen tu participación!\nDr. Armando Q. Angulo Chavira (Universidad Nacional Autónoma de México.)\nDra. Alicia Elvira Vélez García (Universidad Nacional Autónoma de México.)", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 3.33333333333 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":0,"y":-85}, width: 14.7967578369, height: 5, zIndex: 5, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793296187620" }]}];
    const Bienvenida_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793294903896,
    builder_id: 1793294903896,
    trial_name: "Bienvenida",
    
    branches: [1793296406082],
    branchConditions: [],
    defaultNextTrialId: 1793296406082,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793296406082], [], 1793296406082
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Bienvenida_procedure = {
    timeline: 
    [Bienvenida_timeline],
    timeline_variables: test_stimuli_Bienvenida,
    };
    timeline.push(Bienvenida_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793294903896, Bienvenida_procedure);


const test_stimuli_Consentimiento$20$informado$20$1 = [{components: [{ type: "TextComponent", coordinates: {"x":0,"y":84.5555555556}, zIndex: 1, text: "Facultad de Psicología", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":0,"y":60.7777777778}, width: 61.8791125005, height: 4.47249484185, zIndex: 2, text: "CARTA DE CONSENTIMIENTO INFORMADO\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.55555555556 }, { type: "TextComponent", coordinates: {"x":-23.4241342005,"y":44.6802194051}, zIndex: 3, text: "Etapa 1. Desarrollo y validación de materiales\n\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":4.4647546884,"y":13.3333333333}, width: 84.4647546884, height: 27.5555555556, zIndex: 4, text: "A usted se le invita a participar en el estudio “Procesamiento de la información social en la interpretación y evaluación moral de la conducta”, del que es responsable Dr. Armando Quetzalcóatl Angulo Chavira. Puede comunicarse con él a través del correo electrónico institucional angulo_chavira@comunidad.unam.mx.\n\nEste documento contiene la información necesaria para que decida libremente si desea participar. Puede hacer todas las preguntas que considere necesarias antes de decidir. Si acepta, se firmarán dos copias de este consentimiento y una de ellas será para usted.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_4", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":-52.7574675338,"y":-28.3333333333}, zIndex: 5, text: "Objetivo e importancia\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_5", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":4.4647546884,"y":-58.3333333333}, width: 84.8547900896, height: 22.2222222222, zIndex: 6, text: "El objetivo de esta etapa es evaluar y seleccionar enunciados breves que describen conductas y situaciones sociales para contar con materiales adecuados en español de México. Una parte de los enunciados proviene de materiales previamente publicados y adaptados al español; otros fueron elaborados específicamente para este proyecto.\n\nEsta etapa permitirá caracterizar los estímulos que se utilizarán posteriormente para estudiar cómo las personas interpretan y evalúan la conducta de otras personas.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_6", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":75.3536435773,"y":-88.3333333333}, width: 13.5607210572, height: 5, zIndex: 7, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793300082789" }]}];
    const Consentimiento$20$informado$20$1_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793296406082,
    builder_id: 1793296406082,
    trial_name: "Consentimiento informado 1",
    
    branches: [1793300185149],
    branchConditions: [{"id":1793301685512,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793300185149","customParameters":{}}],
    defaultNextTrialId: 1793300185149,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793300185149], [{"id":1793301685512,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793300185149","customParameters":{}}], 1793300185149
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Consentimiento$20$informado$20$1_procedure = {
    timeline: 
    [Consentimiento$20$informado$20$1_timeline],
    timeline_variables: test_stimuli_Consentimiento$20$informado$20$1,
    };
    timeline.push(Consentimiento$20$informado$20$1_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793296406082, Consentimiento$20$informado$20$1_procedure);


const test_stimuli_Consentimiento$20$informado$20$2 = [{components: [{ type: "TextComponent", coordinates: {"x":-48.6666666667,"y":70}, zIndex: 1, text: "¿Qué se le pedirá hacer?\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":5.77777777777,"y":30}, width: 84.455949307, height: 37.5555555556, zIndex: 2, text: "Después de responder un breve cuestionario sociodemográfico y recibir instrucciones, leerá un subconjunto de enunciados y los valorará mediante escalas. Dependiendo de la lista asignada, las valoraciones podrán incluir moralidad, intención atribuida, claridad o ambigüedad, credibilidad, daño, severidad y activación emocional. No existen respuestas correctas o incorrectas; se le pide responder de acuerdo con su percepción.\n\nLa actividad podrá realizarse de manera presencial o en línea y tendrá una duración aproximada de 30 a 45 minutos.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":-43,"y":-11.6666666667}, zIndex: 3, text: "Riesgos y molestias posibles\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":-40.5555555556,"y":-46.6666666667}, width: 38.1579700725, height: 37.5555555556, zIndex: 4, text: "La participación se considera de riesgo mínimo. Algunos enunciados pueden describir conductas negativas o situaciones desagradables y ocasionar incomodidad emocional leve. La lectura continua también puede producir cansancio o fatiga. Podrá hacer una pausa o interrumpir la actividad cuando lo desee.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_4", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":32.7777777778,"y":-10}, zIndex: 5, text: "Beneficios\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_5", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":52.0309618533,"y":-34.2222222222}, width: 42.0309618533, height: 16.8888888889, zIndex: 6, text: "Su participación no implica un beneficio clínico o diagnóstico directo. Su participación contribuirá al desarrollo de materiales en español de México para investigación sobre procesamiento de información social y evaluación moral.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_6", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":70,"y":-75}, width: 15.01200251, height: 5, zIndex: 7, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793300617429" }, { type: "ButtonResponseComponent", coordinates: {"x":30,"y":-75}, height: 5, zIndex: 8, choices: ["Regresar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_2", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793300718031" }]}];
    const Consentimiento$20$informado$20$2_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793300185149,
    builder_id: 1793300185149,
    trial_name: "Consentimiento informado 2",
    
    branches: [1793300783371,"1793296406082"],
    branchConditions: [{"id":1793301717319,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793300783371","customParameters":{}},{"id":1793301736275,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793296406082","customParameters":{}}],
    defaultNextTrialId: 1793300783371,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793300783371,"1793296406082"], [{"id":1793301717319,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793300783371","customParameters":{}},{"id":1793301736275,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793296406082","customParameters":{}}], 1793300783371
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Consentimiento$20$informado$20$2_procedure = {
    timeline: 
    [Consentimiento$20$informado$20$2_timeline],
    timeline_variables: test_stimuli_Consentimiento$20$informado$20$2,
    };
    timeline.push(Consentimiento$20$informado$20$2_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793300185149, Consentimiento$20$informado$20$2_procedure);


const test_stimuli_Consentimiento$20$informado$20$3 = [{components: [{ type: "TextComponent", coordinates: {"x":-48.7777777778,"y":80}, zIndex: 1, text: "Devolución de resultados\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":4,"y":60}, width: 84.0019535236, height: 20.8888888889, zIndex: 2, text: "Los resultados generales del estudio podrán solicitarse a la persona responsable a partir de los seis meses posteriores al cierre de la recolección de datos de la etapa correspondiente, mediante el correo angulo_chavira@comunidad.unam.mx. Debido a la naturaleza de las valoraciones, no se proporcionarán interpretaciones individuales.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":-17.4444444444,"y":28.3333333333}, zIndex: 3, text: "Confidencialidad y aviso de privacidad simplificado\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":4.11111111111,"y":-24.0976117329}, width: 83.8791892712, height: 60.8888888889, zIndex: 4, text: "Los datos personales recabados se utilizarán exclusivamente para verificar los criterios de participación, describir la muestra y realizar los análisis científicos de este proyecto. A cada participante se le asignará un código y las bases utilizadas para el análisis no incluirán su nombre.\n\nLa información será tratada de manera confidencial, de acuerdo con la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados, y será almacenada en una carpeta de Google Drive de acceso restringido al equipo de investigación; los documentos que permitan identificar a las personas participantes se conservarán separados de las bases de datos utilizadas para el análisis. Solo tendrán acceso la persona responsable y las personas integrantes del equipo autorizadas para la recopilación, procesamiento y análisis de los datos. Los resultados podrán publicarse o difundirse con fines científicos únicamente de manera agregada o codificada, sin información que permita identificarle.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_4", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":63.6666666667,"y":-85}, width: 13.7114253207, height: 5, zIndex: 5, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793301009795" }, { type: "ButtonResponseComponent", coordinates: {"x":30.3333333333,"y":-85}, height: 5, zIndex: 6, choices: ["Regresar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_2", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793301061685" }]}];
    const Consentimiento$20$informado$20$3_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793300783371,
    builder_id: 1793300783371,
    trial_name: "Consentimiento informado 3",
    
    branches: [1793301139332,"1793300185149"],
    branchConditions: [{"id":1793301774019,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793301139332","customParameters":{}},{"id":1793301791226,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793300185149","customParameters":{}}],
    defaultNextTrialId: 1793301139332,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793301139332,"1793300185149"], [{"id":1793301774019,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793301139332","customParameters":{}},{"id":1793301791226,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793300185149","customParameters":{}}], 1793301139332
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Consentimiento$20$informado$20$3_procedure = {
    timeline: 
    [Consentimiento$20$informado$20$3_timeline],
    timeline_variables: test_stimuli_Consentimiento$20$informado$20$3,
    };
    timeline.push(Consentimiento$20$informado$20$3_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793300783371, Consentimiento$20$informado$20$3_procedure);


const test_stimuli_Consentimiento$20$informado$20$4 = [{components: [{ type: "TextComponent", coordinates: {"x":-61.4444444444,"y":78.3333333333}, zIndex: 1, text: "Compensación\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":4.77777777778,"y":23.3333333333}, zIndex: 2, text: "Esta etapa no contempla compensación económica ni de otro tipo.\n\nParticipación voluntaria, retiro y atención\n\nSu participación es completamente voluntaria. Puede rechazar la invitación, solicitar una pausa o retirarse en cualquier momento, sin necesidad de dar explicaciones y sin consecuencias académicas, laborales o institucionales. En el transcurso del estudio podrá plantear dudas o solicitar información actualizada a la persona responsable.\n\nSi llegara a experimentar malestar que requiera atención, el equipo podrá orientarle al Programa de Atención Psicológica a Distancia de la Facultad de Psicología de la UNAM, teléfono 55 5025 0855.\n\nSi considera que se incumplieron las condiciones de este consentimiento, recibió un trato inapropiado o desea presentar una queja, puede solicitar orientación mediante la Unidad de Transparencia de la UNAM:", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }, { type: "HtmlComponent", coordinates: {"x":-19.5555555556,"y":-33.2222222222}, zIndex: 3, stimulus: "<p id=\"i8ea\" style=\"box-sizing: border-box;\">https://www.transparencia.unam.mx/unidad-transparencia.html.<br style=\"box-sizing: border-box;\"></p>", name: "HtmlComponent_1" }, { type: "TextComponent", coordinates: {"x":-60.6666666667,"y":-50}, zIndex: 4, text: "Consentimiento\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":3.33333333333,"y":-63.3333333333}, zIndex: 5, text: "Declaro que he leído y comprendido la información anterior, que tuve oportunidad de hacer preguntas y que acepto participar voluntariamente en esta etapa del estudio. Recibiré una copia firmada y fechada de este documento.\n", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_4", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":68,"y":-79}, height: 5, zIndex: 6, choices: ["Acepto"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.41477272727, component_id: "ButtonResponseComponent-1793301474205" }, { type: "ButtonResponseComponent", coordinates: {"x":35.8144102617,"y":-79}, width: 12.9755971087, height: 5, zIndex: 7, choices: ["No acepto"], button_color: "#B85C58", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#B85C58", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_2", _button_font_size_runtime_vw: 2.41477272727, component_id: "ButtonResponseComponent-1793301554175" }, { type: "ButtonResponseComponent", coordinates: {"x":-45.2222222222,"y":-79}, height: 5, zIndex: 8, choices: ["Regresar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_3", _button_font_size_runtime_vw: 2.41477272727, component_id: "ButtonResponseComponent-1793301586499" }]}];
    const Consentimiento$20$informado$20$4_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793301139332,
    builder_id: 1793301139332,
    trial_name: "Consentimiento informado 4",
    
    branches: [1793301815311,1793301875690,"1793300783371"],
    branchConditions: [{"id":1793301824668,"rules":[{"column":"","op":"==","value":"Acepto","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793301815311","customParameters":{}},{"id":1793301909176,"rules":[{"column":"","op":"==","value":"No acepto","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793301875690","customParameters":{}},{"id":1793301933055,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_3","prop":"response"}],"nextTrialId":"1793300783371","customParameters":{}}],
    defaultNextTrialId: 1793301815311,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793301815311,1793301875690,"1793300783371"], [{"id":1793301824668,"rules":[{"column":"","op":"==","value":"Acepto","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793301815311","customParameters":{}},{"id":1793301909176,"rules":[{"column":"","op":"==","value":"No acepto","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793301875690","customParameters":{}},{"id":1793301933055,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_3","prop":"response"}],"nextTrialId":"1793300783371","customParameters":{}}], 1793301815311
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Consentimiento$20$informado$20$4_procedure = {
    timeline: 
    [Consentimiento$20$informado$20$4_timeline],
    timeline_variables: test_stimuli_Consentimiento$20$informado$20$4,
    };
    timeline.push(Consentimiento$20$informado$20$4_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793301139332, Consentimiento$20$informado$20$4_procedure);


const test_stimuli_Precuestionario = [{components: [{ type: "TextComponent", coordinates: {"x":-4.77777777778,"y":65.1111111111}, zIndex: 1, text: "Cuestionario Sociodemográfico", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":0,"y":0}, zIndex: 2, text: "A continuación se te presentaran 6 preguntas, antes de pasar al ensayo. \n\nLa información proporcionada será utilizada únicamente con fines de investigación y será tratada de manera confidencial. Los resultados se analizarán de forma conjunta, sin identificar las respuestas individuales.\n\n\nDa click en el boton para continuar.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":0,"y":-45}, height: 5, zIndex: 3, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793302580207" }]}];
    const Precuestionario_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793301815311,
    builder_id: 1793301815311,
    trial_name: "Precuestionario",
    
    branches: [1793302653029],
    branchConditions: [],
    defaultNextTrialId: 1793302653029,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793302653029], [], 1793302653029
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Precuestionario_procedure = {
    timeline: 
    [Precuestionario_timeline],
    timeline_variables: test_stimuli_Precuestionario,
    };
    timeline.push(Precuestionario_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793301815311, Precuestionario_procedure);


const test_stimuli_Consentimiento$20$Rechazado = [{components: [{ type: "ImageComponent", coordinates: {"x":-74.4505494505,"y":63.8837609609}, zIndex: 1, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.21.jpeg", name: "ImageComponent_1" }, { type: "ImageComponent", coordinates: {"x":2.1978021978,"y":63.0056379489}, zIndex: 2, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22.jpeg", name: "ImageComponent_2" }, { type: "ImageComponent", coordinates: {"x":65.1098901099,"y":58.1759613825}, zIndex: 3, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22%20(1).jpeg", name: "ImageComponent_3" }, { type: "TextComponent", coordinates: {"x":0,"y":0}, zIndex: 4, text: "", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 1.77777777778 }, { type: "TextComponent", coordinates: {"x":0,"y":-12.6666933468}, zIndex: 6, text: "¡Gracias por tu tiempo y participación!\n\nEl equipo de investigación y los organizadores agradecen mucho tu interés y el tiempo que dedicaste a este estudio. \n\n¡Que tengas un buen día!", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.77777777778 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":2.1978021978,"y":-64.7777777778}, zIndex: 5, choices: ["Salir"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793302365843" }]}];
    const Consentimiento$20$Rechazado_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793301875690,
    builder_id: 1793301875690,
    trial_name: "Consentimiento Rechazado",
    
    branches: [],
    branchConditions: [],
    defaultNextTrialId: null,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [], [], null
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Consentimiento$20$Rechazado_procedure = {
    timeline: 
    [Consentimiento$20$Rechazado_timeline],
    timeline_variables: test_stimuli_Consentimiento$20$Rechazado,
    };
    timeline.push(Consentimiento$20$Rechazado_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793301875690, Consentimiento$20$Rechazado_procedure);


const test_stimuli_Cuestionario = [{components: [],
response_components: [{ type: "SurveyComponent", coordinates: {"x":0,"y":0}, zIndex: 1, survey_json: {"pages":[{"elements":[{"type":"text","name":"Fecha de nacimiento","title":"Fecha de nacimiento (DD/MM/AAA)","isRequired":true},{"type":"radiogroup","name":"Sexo biológico","title":"Sexo biológico","isRequired":true,"choices":[{"value":"Mujer","text":"Mujer","imageLink":""},{"value":"Hombre","text":"Hombre","imageLink":""},{"value":"Prefiero no responder","text":"Prefiero no responder","imageLink":""}]},{"type":"radiogroup","name":"Género","title":"Género","isRequired":true,"choices":[{"value":"Femenino","text":"Femenino","imageLink":""},{"value":"Masculino","text":"Masculino","imageLink":""},{"value":"No binario","text":"No binario","imageLink":""},{"value":"Otro","text":"Otro","imageLink":""}]},{"type":"radiogroup","name":"Estudios","title":"Nivel de estudios actual","isRequired":true,"choices":[{"value":"Bachillerato (incompleto)","text":"Bachillerato (incompleto)","imageLink":""},{"value":"Bachillerato (completo)","text":"Bachillerato (completo)","imageLink":""},{"value":"Licenciatura (incompleta)","text":"Licenciatura (incompleta)","imageLink":""},{"value":"Licenciatura (completa)","text":"Licenciatura (completa)","imageLink":""},{"value":"Maestria (incompleta)","text":"Maestria (incompleta)","imageLink":""},{"value":"Maestria (completa)","text":"Maestria (completa)","imageLink":""},{"value":"Doctorado (incompleto)","text":"Doctorado (incompleto)","imageLink":""},{"value":"Doctorado (completo)","text":"Doctorado (completo)","imageLink":""}]},{"type":"boolean","name":"Mayoría de vida en México","title":"¿Has vivido la mayor parte de tu vida en México?","isRequired":true},{"type":"radiogroup","name":"Estado de la República","title":"¿En qué Estado de la República?","isRequired":true,"choices":[{"value":"Aguascalientes","text":"Aguascalientes","imageLink":""},{"value":"Baja California","text":"Baja California","imageLink":""},{"value":"Baja California Sur","text":"Baja California Sur","imageLink":""},{"value":"Campeche","text":"Campeche","imageLink":""},{"value":"Chiapas","text":"Chiapas","imageLink":""},{"value":"Chihuaha","text":"Chihuaha","imageLink":""},{"value":"Coahuila de Zaragoza","text":"Coahuila de Zaragoza","imageLink":""},{"value":"Colima","text":"Colima","imageLink":""},{"value":"Ciudad de México","text":"Ciudad de México","imageLink":""},{"value":"Durango","text":"Durango","imageLink":""},{"value":"Guanajuato","text":"Guanajuato","imageLink":""},{"value":"Guerrero","text":"Guerrero","imageLink":""},{"value":"Hidalgo","text":"Hidalgo","imageLink":""},{"value":"Jalisco","text":"Jalisco","imageLink":""},{"value":"Estado de México","text":"Estado de México","imageLink":""},{"value":"Michoacan de Ocampo","text":"Michoacan de Ocampo","imageLink":""},{"value":"Morelos","text":"Morelos","imageLink":""},{"value":"Nayarit","text":"Nayarit","imageLink":""},{"value":"Nuevo León","text":"Nuevo León","imageLink":""},{"value":"Oaxaca","text":"Oaxaca","imageLink":""},{"value":"Puebla","text":"Puebla","imageLink":""},{"value":"Querétaro","text":"Querétaro","imageLink":""},{"value":"Quintana Roo","text":"Quintana Roo","imageLink":""},{"value":"San Luis Potosí","text":"San Luis Potosí","imageLink":""},{"value":"Sinaloa","text":"Sinaloa","imageLink":""},{"value":"Sonora","text":"Sonora","imageLink":""},{"value":"Tabasco","text":"Tabasco","imageLink":""},{"value":"Tamaulipas","text":"Tamaulipas","imageLink":""},{"value":"Tlaxcala","text":"Tlaxcala","imageLink":""},{"value":"Veracruz de Ignacio de la Llave","text":"Veracruz de Ignacio de la Llave","imageLink":""},{"value":"Yucatán ","text":"Yucatán ","imageLink":""},{"value":"Zacatecas","text":"Zacatecas","imageLink":""}]}]}]}, name: "SurveyComponent_1", component_id: "SurveyComponent-1793302679353" }]}];
    const Cuestionario_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793302653029,
    builder_id: 1793302653029,
    trial_name: "Cuestionario",
    
    branches: [1793303572323],
    branchConditions: [],
    defaultNextTrialId: 1793303572323,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793303572323], [], 1793303572323
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Cuestionario_procedure = {
    timeline: 
    [Cuestionario_timeline],
    timeline_variables: test_stimuli_Cuestionario,
    };
    timeline.push(Cuestionario_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793302653029, Cuestionario_procedure);


const test_stimuli_Instrucciones = [{components: [{ type: "TextComponent", coordinates: {"x":0,"y":78.3333333333}, zIndex: 1, text: "Tarea de evaluación de afirmaciones", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":5.22222222222,"y":20}, width: 84.9667197217, height: 37.5555555556, zIndex: 2, text: "Leerás afirmaciones que describen conductas o situaciones de distintas personas. Imagina que cada afirmación describe a una persona diferente y evalúala por separado. No hay respuestas correctas o incorrectas: nos interesa tu valoración personal.\n\nMoralidad: ¿Qué tan moralmente mala o buena consideras la conducta descrita? (−4 = Muy moralmente mala; 0 = Neutral; +4 = Muy moralmente buena).\nCompetencia: ¿Qué tan competente demuestra ser la persona según la conducta descrita? (−4 = Muy incapaz; 0 = Neutral; +4 = Muy capaz).\nInformatividad: ¿Qué tan útil es la información para formarte una impresión de la persona? (0 = Nada informativa; 8 = Muy informativa).\nCredibilidad: ¿Qué tan creíble te parece la situación descrita? Piensa qué tan posible es que ocurra en la vida real. (0 = Nada creíble; 8 = Muy creíble).", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":-56.4444444444,"y":64.2222222222}, zIndex: 3, text: "¿Cómo responder?", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":-40.5555555556,"y":-56.6666666667}, width: 39.4714128232, height: 37.5555555556, zIndex: 4, text: "• Lee cada afirmación con atención.\n• Selecciona una de las nueve opciones en cada dimensión.\n• Puedes elegir cualquier valor, incluido el punto medio o los extremos.\n• Evalúa las cuatro dimensiones por separado.\n• Primero realizarás tres ensayos de práctica.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_4", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":-51,"y":-24.2222222222}, zIndex: 5, text: "Responde así", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_5", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":50,"y":-43.3333333333}, width: 38.495179794, height: 24.2222222222, zIndex: 6, text: "• No intentes buscar una respuesta correcta.\n• No te bases en información que no aparece en la afirmación.\n• No relaciones la afirmación con las anteriores.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "left", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_6", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":46.6666666667,"y":-24.2222222222}, zIndex: 7, text: "Ten en cuenta", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_7", _font_size_runtime_vw: 2.77777777778 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":74.6666666667,"y":-75}, height: 5, zIndex: 8, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793303924531" }]}];
    const Instrucciones_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793303572323,
    builder_id: 1793303572323,
    trial_name: "Instrucciones",
    
    branches: [1793304006966],
    branchConditions: [{"id":1793304037561,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793304006966","customParameters":{}}],
    defaultNextTrialId: 1793304006966,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793304006966], [{"id":1793304037561,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793304006966","customParameters":{}}], 1793304006966
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Instrucciones_procedure = {
    timeline: 
    [Instrucciones_timeline],
    timeline_variables: test_stimuli_Instrucciones,
    };
    timeline.push(Instrucciones_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793303572323, Instrucciones_procedure);


const test_stimuli_Pre$2d$ensayo = [{components: [{ type: "TextComponent", coordinates: {"x":0.111111111111,"y":74.2222222222}, zIndex: 1, text: "Ensayo", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.77777777778 }, { type: "TextComponent", coordinates: {"x":0,"y":0}, zIndex: 2, text: "A continuación realizaras tres ensayos, antes de pasar a la prueba. Recuerda responder honestamente, lo más pronto que puedas y seleccionar una respuesta para cada escala.\n\nDa click en el boton para comenzar.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":35.3333333333,"y":-65}, height: 5, zIndex: 3, choices: ["Continuar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793304165500" }, { type: "ButtonResponseComponent", coordinates: {"x":-35.5555555556,"y":-65}, width: 14.4599917954, height: 5, zIndex: 4, choices: ["Regresar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_2", _button_font_size_runtime_vw: 2.77777777778, component_id: "ButtonResponseComponent-1793304300333" }]}];
    const Pre$2d$ensayo_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793304006966,
    builder_id: 1793304006966,
    trial_name: "Pre-ensayo",
    
    branches: [1793304388942,"1793303572323"],
    branchConditions: [{"id":1793578539211,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793304388942","customParameters":{}},{"id":1793578565552,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793303572323","customParameters":{}}],
    defaultNextTrialId: 1793304388942,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793304388942,"1793303572323"], [{"id":1793578539211,"rules":[{"column":"","op":"==","value":"Continuar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_1","prop":"response"}],"nextTrialId":"1793304388942","customParameters":{}},{"id":1793578565552,"rules":[{"column":"","op":"==","value":"Regresar","fieldType":"response_components","componentIdx":"ButtonResponseComponent_2","prop":"response"}],"nextTrialId":"1793303572323","customParameters":{}}], 1793304388942
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Pre$2d$ensayo_procedure = {
    timeline: 
    [Pre$2d$ensayo_timeline],
    timeline_variables: test_stimuli_Pre$2d$ensayo,
    };
    timeline.push(Pre$2d$ensayo_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793304006966, Pre$2d$ensayo_procedure);



    const test_stimuli_loop_1793578740463 = [
  {
    "components_Ensayo": [
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 85.9023836549
        },
        "zIndex": 1,
        "text": "La persona X nunca aprendió a recortar con tijeras sobre la línea.",
        "font_color": "#000000",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_1",
        "_font_size_runtime_vw": 3.28222222222
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Malo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 82.2222222222,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Bueno",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 14.2222222222
        },
        "zIndex": 13,
        "text": "Incapaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": 14.2222222222
        },
        "zIndex": 14,
        "text": "Capaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -25.3333333333
        },
        "width": 17.3135561946,
        "height": 10.5555555556,
        "zIndex": 15,
        "text": "Poco informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": -25.6666666667
        },
        "width": 15.2223126869,
        "height": 9.22222222222,
        "zIndex": 16,
        "text": "Muy informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -60.5555555556
        },
        "width": 9.84065826759,
        "height": 13.4444444444,
        "zIndex": 17,
        "text": "Poco creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 86.4468315207,
          "y": -61.4444444444
        },
        "width": 13.9977033884,
        "height": 9.22222222222,
        "zIndex": 18,
        "text": "Muy creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 70
        },
        "zIndex": 20,
        "text": "Moralidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 31.7777777778
        },
        "zIndex": 21,
        "text": "Competencia",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -6.22222222222
        },
        "zIndex": 22,
        "text": "Informatividad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -48
        },
        "zIndex": 23,
        "text": "Credibilidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_3",
        "_font_size_runtime_vw": 2.77777777778
      }
    ],
    "response_components_Ensayo": [
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -24.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 2,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579263031"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 51.3333333333
        },
        "width": 80,
        "height": 14.498685614,
        "zIndex": 6,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Moralidad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579266352"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 14.2222222222
        },
        "width": 80,
        "height": 14.1966844298,
        "zIndex": 7,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Competencia",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579600220-0-w73weg"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -62.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 8,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad_copy",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579777880-0-vopql6"
      },
      {
        "type": "ButtonResponseComponent",
        "coordinates": {
          "x": 75.4444444444,
          "y": -85
        },
        "width": 14.7663551652,
        "height": 5,
        "zIndex": 19,
        "choices": [
          "Siguiente"
        ],
        "button_color": "#A3B18A",
        "button_text_color": "#000000",
        "button_border_radius": 3,
        "button_border_color": "#A3B18A",
        "button_border_width": 1,
        "button_padding": "6px 14px",
        "name": "ButtonResponseComponent_1",
        "_button_font_size_runtime_vw": 2.77777777778,
        "component_id": "ButtonResponseComponent-1793639430344"
      }
    ],
    "response_ends_trial_Ensayo": true,
    "require_response_components_Ensayo": [
      "SliderResponseComponent-1793579263031",
      "SliderResponseComponent-1793579266352",
      "SliderResponseComponent-1793579600220-0-w73weg",
      "SliderResponseComponent-1793579777880-0-vopql6",
      "ButtonResponseComponent-1793639430344"
    ]
  },
  {
    "components_Ensayo": [
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 85.9023836549
        },
        "zIndex": 1,
        "text": "La persona X resolvió una sopa de letras en el periódico.",
        "font_color": "#000000",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_1",
        "_font_size_runtime_vw": 3.28222222222
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Malo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 82.2222222222,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Bueno",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 14.2222222222
        },
        "zIndex": 13,
        "text": "Incapaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": 14.2222222222
        },
        "zIndex": 14,
        "text": "Capaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -25.3333333333
        },
        "width": 17.3135561946,
        "height": 10.5555555556,
        "zIndex": 15,
        "text": "Poco informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": -25.6666666667
        },
        "width": 15.2223126869,
        "height": 9.22222222222,
        "zIndex": 16,
        "text": "Muy informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -60.5555555556
        },
        "width": 9.84065826759,
        "height": 13.4444444444,
        "zIndex": 17,
        "text": "Poco creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 86.4468315207,
          "y": -61.4444444444
        },
        "width": 13.9977033884,
        "height": 9.22222222222,
        "zIndex": 18,
        "text": "Muy creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 70
        },
        "zIndex": 20,
        "text": "Moralidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 31.7777777778
        },
        "zIndex": 21,
        "text": "Competencia",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -6.22222222222
        },
        "zIndex": 22,
        "text": "Informatividad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -48
        },
        "zIndex": 23,
        "text": "Credibilidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_3",
        "_font_size_runtime_vw": 2.77777777778
      }
    ],
    "response_components_Ensayo": [
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -24.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 2,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579263031"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 51.3333333333
        },
        "width": 80,
        "height": 14.498685614,
        "zIndex": 6,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Moralidad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579266352"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 14.2222222222
        },
        "width": 80,
        "height": 14.1966844298,
        "zIndex": 7,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Competencia",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579600220-0-w73weg"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -62.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 8,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad_copy",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579777880-0-vopql6"
      },
      {
        "type": "ButtonResponseComponent",
        "coordinates": {
          "x": 75.4444444444,
          "y": -85
        },
        "width": 14.7663551652,
        "height": 5,
        "zIndex": 19,
        "choices": [
          "Siguiente"
        ],
        "button_color": "#A3B18A",
        "button_text_color": "#000000",
        "button_border_radius": 3,
        "button_border_color": "#A3B18A",
        "button_border_width": 1,
        "button_padding": "6px 14px",
        "name": "ButtonResponseComponent_1",
        "_button_font_size_runtime_vw": 2.77777777778,
        "component_id": "ButtonResponseComponent-1793639430344"
      }
    ],
    "response_ends_trial_Ensayo": true,
    "require_response_components_Ensayo": [
      "SliderResponseComponent-1793579263031",
      "SliderResponseComponent-1793579266352",
      "SliderResponseComponent-1793579600220-0-w73weg",
      "SliderResponseComponent-1793579777880-0-vopql6",
      "ButtonResponseComponent-1793639430344"
    ]
  },
  {
    "components_Ensayo": [
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 85.9023836549
        },
        "zIndex": 1,
        "text": "La persona X hizo todas las reparaciones de su moto.",
        "font_color": "#000000",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_1",
        "_font_size_runtime_vw": 3.28222222222
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Malo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 82.2222222222,
          "y": 54.8888888889
        },
        "zIndex": 12,
        "text": "Bueno",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -82.6864438054,
          "y": 14.2222222222
        },
        "zIndex": 13,
        "text": "Incapaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": 14.2222222222
        },
        "zIndex": 14,
        "text": "Capaz",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -25.3333333333
        },
        "width": 17.3135561946,
        "height": 10.5555555556,
        "zIndex": 15,
        "text": "Poco informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 85.2223126869,
          "y": -25.6666666667
        },
        "width": 15.2223126869,
        "height": 9.22222222222,
        "zIndex": 16,
        "text": "Muy informativo",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": -85.1579937267,
          "y": -60.5555555556
        },
        "width": 9.84065826759,
        "height": 13.4444444444,
        "zIndex": 17,
        "text": "Poco creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_2_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 86.4468315207,
          "y": -61.4444444444
        },
        "width": 13.9977033884,
        "height": 9.22222222222,
        "zIndex": 18,
        "text": "Muy creíble",
        "font_color": "#8000FF",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_2_copy_copy_copy_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 70
        },
        "zIndex": 20,
        "text": "Moralidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": 31.7777777778
        },
        "zIndex": 21,
        "text": "Competencia",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -6.22222222222
        },
        "zIndex": 22,
        "text": "Informatividad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_2",
        "_font_size_runtime_vw": 2.77777777778
      },
      {
        "type": "TextComponent",
        "coordinates": {
          "x": 0,
          "y": -48
        },
        "zIndex": 23,
        "text": "Credibilidad",
        "font_color": "#9e9e9e",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "text_align": "center",
        "line_height": 1.5,
        "background_color": "transparent",
        "padding": "0px",
        "border_radius": 0,
        "border_color": "transparent",
        "border_width": 0,
        "name": "TextComponent_3_copy_3",
        "_font_size_runtime_vw": 2.77777777778
      }
    ],
    "response_components_Ensayo": [
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -24.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 2,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579263031"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 51.3333333333
        },
        "width": 80,
        "height": 14.498685614,
        "zIndex": 6,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Moralidad",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579266352"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": 14.2222222222
        },
        "width": 80,
        "height": 14.1966844298,
        "zIndex": 7,
        "min": -4,
        "max": 4,
        "slider_start": 0,
        "labels": [
          "-4",
          "-3",
          "-2",
          "-1",
          "0",
          "1",
          "2",
          "3",
          "4"
        ],
        "slider_width": 300,
        "name": "Competencia",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579600220-0-w73weg"
      },
      {
        "type": "SliderResponseComponent",
        "coordinates": {
          "x": 0,
          "y": -62.3333333333
        },
        "width": 80,
        "height": 14.350688309,
        "zIndex": 8,
        "min": 0,
        "max": 8,
        "slider_start": 4,
        "labels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "slider_width": 300,
        "name": "Informatividad_copy",
        "require_movement": true,
        "component_id": "SliderResponseComponent-1793579777880-0-vopql6"
      },
      {
        "type": "ButtonResponseComponent",
        "coordinates": {
          "x": 75.4444444444,
          "y": -85
        },
        "width": 14.7663551652,
        "height": 5,
        "zIndex": 19,
        "choices": [
          "Siguiente"
        ],
        "button_color": "#A3B18A",
        "button_text_color": "#000000",
        "button_border_radius": 3,
        "button_border_color": "#A3B18A",
        "button_border_width": 1,
        "button_padding": "6px 14px",
        "name": "ButtonResponseComponent_1",
        "_button_font_size_runtime_vw": 2.77777777778,
        "component_id": "ButtonResponseComponent-1793639430344"
      }
    ],
    "response_ends_trial_Ensayo": true,
    "require_response_components_Ensayo": [
      "SliderResponseComponent-1793579263031",
      "SliderResponseComponent-1793579266352",
      "SliderResponseComponent-1793579600220-0-w73weg",
      "SliderResponseComponent-1793579777880-0-vopql6",
      "ButtonResponseComponent-1793639430344"
    ]
  }
];
    
    
    const Ensayo_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components_Ensayo"),
response_components: jsPsych.timelineVariable("response_components_Ensayo"),
response_ends_trial: jsPsych.timelineVariable("response_ends_trial_Ensayo"),
require_response_components: jsPsych.timelineVariable("require_response_components_Ensayo"),
data: {
    rt: "rt_Ensayo",
    trial_id: 1793304388942,
    builder_id: 1793304388942,
    trial_name: "Ensayo",
    isInLoop: true,
    branches: [1793579048529],
    branchConditions: [],
    defaultNextTrialId: 1793579048529,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793579048529], [], 1793579048529
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
window.ExpBuilderNavigation?.registerTrial(1793304388942, Ensayo_timeline);

    const loop_1793578740463_procedure = {
      timeline: [Ensayo_timeline],
      timeline_variables: test_stimuli_loop_1793578740463.length ? test_stimuli_loop_1793578740463 : [{}],
      get repetitions() {
    return window.ExpBuilderNavigation?.remainingLoopRepetitions("loop_1793578740463", 1) ?? 1;
  },
  randomize_order: false,
  sample: { type: 'custom', fn: function(indices) {
    if (window.ExpBuilderNavigation) {
      return window.ExpBuilderNavigation.sampleLoop("loop_1793578740463", indices, true, false);
    }
    return jsPsych.randomization.shuffle(indices);
  } },
      

  data: {
    loop_id: "loop_1793578740463"
  },
};
window.ExpBuilderNavigation?.registerLoop("loop_1793578740463", loop_1793578740463_procedure, {"entryItemId":1793304388942,"nextItemId":null});
timeline.push(loop_1793578740463_procedure);



const test_stimuli_Final$20$ensayo = [{components: [{ type: "TextComponent", coordinates: {"x":0,"y":42.4444444444}, zIndex: 1, text: "¡Buen ensayo!", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 4.44444444444 }, { type: "TextComponent", coordinates: {"x":0,"y":0}, zIndex: 2, text: "Ahora da click en el botón para iniciar el experimento", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 3.22222222222 }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":0,"y":-30}, width: 14.1635381112, height: 3.77777777778, zIndex: 3, choices: ["Iniciar experimento"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 2.22222222222, component_id: "ButtonResponseComponent-1793642417899" }]}];
    const Final$20$ensayo_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793579048529,
    builder_id: 1793579048529,
    trial_name: "Final ensayo",
    
    branches: [1793642521181],
    branchConditions: [],
    defaultNextTrialId: 1793642521181,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793642521181], [], 1793642521181
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Final$20$ensayo_procedure = {
    timeline: 
    [Final$20$ensayo_timeline],
    timeline_variables: test_stimuli_Final$20$ensayo,
    };
    timeline.push(Final$20$ensayo_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793579048529, Final$20$ensayo_procedure);


    let test_stimuli_loop_1793650037960 = [];
    
        const test_stimuli_previous_loop_1793650037960 = (await Promise.all(
      ["data/estimulos_001.json", "data/estimulos_002.json", "data/estimulos_003.json", "data/estimulos_004.json", "data/estimulos_005.json", "data/estimulos_006.json", "data/estimulos_007.json", "data/estimulos_008.json", "data/estimulos_009.json"].map(async (path) => {
        const response = await fetch(path, {cache: 'default'});
        if (!response.ok) throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error(`Invalid stimulus file: ${path}`);
        return rows;
      })
    )).flat();
    if (test_stimuli_previous_loop_1793650037960.length !== 480) {
      throw new Error('Incomplete stimulus data: expected 480 records.');
    }
    if (typeof participantNumber === "number" && Number.isInteger(participantNumber) && participantNumber > 0) {
      const stimuliOrders = [];
      const categoryData = ["List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_1","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_2","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_3","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_4","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_5","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6","List_6"];
      
      
      if (categoryData.length > 0) {
        // Get all unique categories
        const allCategories = [...new Set(categoryData)];
        
        // Determine which category corresponds to this participant
        const categoryIndex = (participantNumber - 1) % allCategories.length;
        const participantCategory = allCategories[categoryIndex];
        
        // Find the indices that correspond to this category
        const categoryIndices = [];
        categoryData.forEach((category, index) => {
          if (category === participantCategory) {
            categoryIndices.push(index);
          }
        });
        
        // Filter stimuli by category
        const categoryFilteredStimuli = categoryIndices.map(index => 
          test_stimuli_previous_loop_1793650037960[index]
        );

        // Apply the order if it exists
        if (stimuliOrders.length > 0) {
          const orderIndex = (participantNumber - 1) % stimuliOrders.length;
          const index_order = stimuliOrders[orderIndex];
          
          // Create mapping from original indices to filtered indices
          const indexMapping = {};
          categoryIndices.forEach((originalIndex, filteredIndex) => {
            indexMapping[originalIndex] = filteredIndex;
          });
          
          // Apply the order only to indices that exist in the filtered category
          const orderedIndices = index_order
            .filter(i => indexMapping.hasOwnProperty(i))
            .map(i => indexMapping[i]);
          
          const orderedStimuli = orderedIndices
            .filter(i => i >= 0 && i < categoryFilteredStimuli.length)
            .map(i => categoryFilteredStimuli[i]);
          test_stimuli_loop_1793650037960 = orderedStimuli.length > 0
            ? orderedStimuli : categoryFilteredStimuli;
        } else {
          test_stimuli_loop_1793650037960 = categoryFilteredStimuli;
        }
      } else if (stimuliOrders.length > 0) {
        // Original logic without categories
        const orderIndex = (participantNumber - 1) % stimuliOrders.length;
        const index_order = stimuliOrders[orderIndex];
        
        const orderedStimuli = index_order
          .filter((i) => i !== -1 && i >= 0 && i < test_stimuli_previous_loop_1793650037960.length)
          .map((i) => test_stimuli_previous_loop_1793650037960[i]);
        test_stimuli_loop_1793650037960 = orderedStimuli.length > 0
          ? orderedStimuli : test_stimuli_previous_loop_1793650037960;
      } else {
        test_stimuli_loop_1793650037960 = test_stimuli_previous_loop_1793650037960;
      }
    } else {
      test_stimuli_loop_1793650037960 = test_stimuli_previous_loop_1793650037960;
    }
    window.ExpBuilderRuntime?.emit("stimuli-selected", {
      loopId: "loop_1793650037960",
      count: test_stimuli_loop_1793650037960.length,
      orders: false,
      categories: true
    });
    
    
    const Behavioral$20$Statements_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components_Behavioral$20$Statements"),
response_components: jsPsych.timelineVariable("response_components_Behavioral$20$Statements"),
response_ends_trial: jsPsych.timelineVariable("response_ends_trial_Behavioral$20$Statements"),
require_response_components: jsPsych.timelineVariable("require_response_components_Behavioral$20$Statements"),
data: {
    rt: "rt_Behavioral$20$Statements",
    trial_id: 1793642521181,
    builder_id: 1793642521181,
    trial_name: "Behavioral Statements",
    isInLoop: true,
    branches: [1793649983720],
    branchConditions: [],
    defaultNextTrialId: 1793649983720,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [1793649983720], [], 1793649983720
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
window.ExpBuilderNavigation?.registerTrial(1793642521181, Behavioral$20$Statements_timeline);

    // Limitar SOLO los estímulos que ejecuta el bloque principal. El catálogo,
    // la selección por participante y los datos originales no se modifican.
    const test_stimuli_principal_ejecutar = VALIDACION_PRUEBA_ACTIVA
      ? test_stimuli_loop_1793650037960.slice(0, 3)
      : test_stimuli_loop_1793650037960;
    window.ValidacionPrueba.principal = test_stimuli_principal_ejecutar.length;
    if (VALIDACION_PRUEBA_ACTIVA) {
      console.info('[Validación] Bloque principal limitado a', test_stimuli_principal_ejecutar.length, 'ensayos.');
    }

    const loop_1793650037960_procedure = {
      timeline: [Behavioral$20$Statements_timeline],
      timeline_variables: test_stimuli_principal_ejecutar.length ? test_stimuli_principal_ejecutar : [{}],
      get repetitions() {
    return window.ExpBuilderNavigation?.remainingLoopRepetitions("loop_1793650037960", 1) ?? 1;
  },
  randomize_order: false,
  sample: { type: 'custom', fn: function(indices) {
    if (window.ExpBuilderNavigation) {
      return window.ExpBuilderNavigation.sampleLoop("loop_1793650037960", indices, true, false);
    }
    return jsPsych.randomization.shuffle(indices);
  } },
      

  data: {
    loop_id: "loop_1793650037960"
  },
};
window.ExpBuilderNavigation?.registerLoop("loop_1793650037960", loop_1793650037960_procedure, {"entryItemId":1793642521181,"nextItemId":1793649983720});
timeline.push(loop_1793650037960_procedure);



const test_stimuli_Final$20$Experimento = [{components: [{ type: "TextComponent", coordinates: {"x":0,"y":35.9023836549}, zIndex: 1, text: "¡Gracias por tu participación!", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_1", _font_size_runtime_vw: 2.83777777778 }, { type: "TextComponent", coordinates: {"x":0,"y":0}, zIndex: 2, text: "El equipo de investigación y los organizadores agradecen mucho tu interés y el tiempo que dedicaste a este estudio.", font_color: "#000000", font_family: "sans-serif", font_weight: "normal", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_2", _font_size_runtime_vw: 2.22222222222 }, { type: "TextComponent", coordinates: {"x":0,"y":-34.4444444444}, zIndex: 3, text: "¡Que tengas un buen dia!", font_color: "#000000", font_family: "sans-serif", font_weight: "bold", font_style: "normal", text_align: "center", line_height: 1.5, background_color: "transparent", padding: "0px", border_radius: 0, border_color: "transparent", border_width: 0, name: "TextComponent_3", _font_size_runtime_vw: 2.77777777778 }, { type: "ImageComponent", coordinates: {"x":-70.336035877,"y":69.0297003772}, width: 19.6666666667, height: 20.3869128747, zIndex: 5, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.21.jpeg", name: "ImageComponent_1" }, { type: "ImageComponent", coordinates: {"x":-0.666666666667,"y":71.3471838577}, width: 20.7777777778, height: 20.3750150502, zIndex: 6, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22.jpeg", name: "ImageComponent_2" }, { type: "ImageComponent", coordinates: {"x":69.8753489113,"y":70.1943910297}, width: 20.1111111111, height: 19.19424026, zIndex: 7, stimulus: "img/WhatsApp%20Image%202026-10-26%20at%2010.53.22%20(1).jpeg", name: "ImageComponent_3" }, { type: "ImageComponent", coordinates: {"x":-59.4444444444,"y":-75.1111111111}, width: 39.3659490487, height: 24.8888888889, zIndex: 8, stimulus: "img/Mona.png", name: "ImageComponent_4" }, { type: "ImageComponent", coordinates: {"x":66.6666666667,"y":-71.3333333333}, zIndex: 9, stimulus: "img/Mono.png", name: "ImageComponent_5" }],
response_components: [{ type: "ButtonResponseComponent", coordinates: {"x":0,"y":-85}, height: 5, zIndex: 4, choices: ["Finalizar"], button_color: "#A3B18A", button_text_color: "#000000", button_border_radius: 3, button_border_color: "#A3B18A", button_border_width: 1, button_padding: "6px 14px", name: "ButtonResponseComponent_1", _button_font_size_runtime_vw: 1.55555555556, component_id: "ButtonResponseComponent-1793650401129" }]}];
    const Final$20$Experimento_timeline = {
    type: DynamicPlugin, components: jsPsych.timelineVariable("components"),
response_components: jsPsych.timelineVariable("response_components"),

data: {
    rt: "rt",
    trial_id: 1793649983720,
    builder_id: 1793649983720,
    trial_name: "Final Experimento",
    
    branches: [],
    branchConditions: [],
    defaultNextTrialId: null,
  },
    
    on_start: function(trial) {
      // Then apply custom parameters from branching conditions (higher priority)
      const branchParameters = window.ExpBuilderNavigation?.takeParameters(trial.data?.builder_id ?? trial.data?.trial_id);

      if (branchParameters && typeof branchParameters === 'object') {
        Object.entries(branchParameters).forEach(([key, param]) => {
          if (param && param.source !== 'none') {
            // Parse key to check if it's a nested survey question
            const parts = key.split('::');
            
            if (parts.length === 4) {
              // Format: fieldType::componentName::survey_json::questionName
              const [fieldType, componentName, propName, questionName] = parts;
              
              if (fieldType && componentName && propName === 'survey_json' && questionName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1 && fieldArray[compIndex].survey_json) {
                    // Survey questions can live in a root "elements" array or
                    // inside "pages"; survey-core ignores page questions when
                    // both exist.
                    const findSurveyQuestion = (surveyJson, questionName) => {
                      if (!surveyJson) return undefined;
                      const lists = [];
                      if (Array.isArray(surveyJson.pages)) {
                        for (const page of surveyJson.pages) {
                          if (Array.isArray(page && page.elements)) lists.push(page.elements);
                        }
                      }
                      if (Array.isArray(surveyJson.elements)) lists.push(surveyJson.elements);
                      for (const list of lists) {
                        const found = list.find((item) => item && item.name === questionName);
                        if (found) return found;
                      }
                      return undefined;
                    };
                    const question = findSurveyQuestion(fieldArray[compIndex].survey_json, questionName);
                    
                    if (question) {
                      // Apply the override value (from typed or csv)
                      let valueToSet;
                      if (param.source === 'typed') {
                        valueToSet = String(param.value); // Convert to string for SurveyJS
                      } else if (param.source === 'csv') {
                        valueToSet = String(trial[param.value]); // Get from CSV column and convert to string
                      }
                      
                      if (valueToSet !== undefined && valueToSet !== null) {
                        question.defaultValue = valueToSet;
                      }
                    }
                  }
                }
              }
            } else if (parts.length === 3) {
              // Format: fieldType::componentName::property (for DynamicPlugin components)
              const [fieldType, componentName, propName] = parts;
              
              if (fieldType && componentName && propName) {
                // Find the component by name in the field array
                const fieldArray = trial[fieldType];
                if (Array.isArray(fieldArray)) {
                  const compIndex = fieldArray.findIndex(c => c.name === componentName);
                  if (compIndex !== -1) {
                    // Apply the override value (from typed or csv)
                    let valueToSet;
                    if (param.source === 'typed') {
                      valueToSet = param.value;
                    } else if (param.source === 'csv') {
                      valueToSet = trial[param.value];
                    }
                    
                    if (valueToSet !== undefined && valueToSet !== null) {
                      fieldArray[compIndex][propName] = valueToSet;
                    }
                  }
                }
              }
            } else {
              // Normal parameter (not nested survey question)
              if (param.source === 'typed' && param.value !== undefined && param.value !== null) {
                trial[key] = param.value;
              } else if (param.source === 'csv' && param.value !== undefined && param.value !== null) {
                trial[key] = trial[param.value];
              }
            }
          }
        });
      }
      
    },
    
    on_finish: function(data) {
    
    
      const branchDecision = window.ExpBuilderBranching.decide(
        data, [], [], null
      );
      window.ExpBuilderNavigation?.requestBranch(data, branchDecision);
  
  },};
    const Final$20$Experimento_procedure = {
    timeline: 
    [Final$20$Experimento_timeline],
    timeline_variables: test_stimuli_Final$20$Experimento,
    };
    timeline.push(Final$20$Experimento_procedure);
  
window.ExpBuilderNavigation?.registerTrial(1793649983720, Final$20$Experimento_procedure);

    window.ValidacionBienvenida.install(timeline);
    window.ValidacionConsentimiento.install(timeline);
    window.ValidacionPantallas.install(timeline);
    window.JuiciosSurvey.install(timeline);
    window.JuiciosEvaluacion.install(timeline);
    window.ExpBuilderNavigation?.attach(jsPsych, timeline);
    jsPsych.run(timeline);


  })().catch(function(error) {
    console.error('[session-persistence] experiment startup blocked', {
      experimentID: window.JSPSYCH_EXPERIMENT_ID,
      sessionId: window.JSPSYCH_SESSION_ID || null,
      error: error.message
    });
    _setLoadingMsg('No se pudo iniciar el experimento. Revisa tu conexión.');
  });
