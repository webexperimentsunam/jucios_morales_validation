/* Juicios Morales v11: Cuestionario sociodemografico como ensayo nativo de jsPsych.
   Respeta trial_id, nombre de componente y claves de respuesta del original. */
(function (win, doc) {
  'use strict';
  const diagnostics = { version:'11.0', installed:0, rendered:0, submitted:0,
    invalid:0, lastError:null, lastKeys:[] };
  win.JuiciosSurveyDiagnostics = diagnostics;

  const elem = (tag, className, text) => {
    const node=doc.createElement(tag);
    if (className) node.className=className;
    if (text != null) node.textContent=String(text);
    return node;
  };
  const displayCorrections = {
    'Chihuaha':'Chihuahua', 'Michoacan de Ocampo':'Michoacán de Ocampo',
    'Yucatán ':'Yucatán',
    'Maestria (incompleta)':'Maestría (incompleta)',
    'Maestria (completa)':'Maestría (completa)'
  };
  const labelOf = choice => displayCorrections[choice.value] || choice.text || choice.value;
  const valueOf = choice => String(choice.value ?? choice.text ?? choice);
  const required = (field) => elem('span','jm-required', field.isRequired ? ' *' : '');
  const fields = (source) => source.response_components[0].survey_json.pages[0].elements;

  function getSource(timeline) {
    const found=[];
    function walk(items) {
      for (const item of items || []) {
        if (!item || !Array.isArray(item.timeline)) continue;
        for (const node of item.timeline) {
          if (node?.data?.trial_name==='Cuestionario') {
            found.push({node, parent:item});
          }
        }
        walk(item.timeline);
      }
    }
    walk(timeline);
    if (found.length !== 1) throw Error('Se esperaba un solo Cuestionario; encontrados: '+found.length);
    const {node,parent}=found[0];
    const row=parent.timeline_variables?.[0];
    if (!row || row.components?.length !== 0 || row.response_components?.length !== 1 ||
        row.response_components[0].type !== 'SurveyComponent' || !row.response_components[0].survey_json)
      throw Error('La estructura de Cuestionario no coincide con el original');
    const q=fields(row);
    const names=q.map(x=>x.name);
    const expected=['Fecha de nacimiento','Sexo biológico','Género','Estudios','Mayoría de vida en México','Estado de la República'];
    if (names.join('|')!==expected.join('|')) throw Error('Cambiaron las variables del Survey: '+names.join(', '));
    return {node,row,questions:q};
  }

  function section(parent,title,lead) {
    const s=elem('section','jm-section');
    s.append(elem('h2','jm-section-title',title));
    if (lead) s.append(elem('p','jm-section-lead',lead));
    parent.append(s);return s;
  }
  function fieldBox(question, additionalClass='') {
    const box=elem('div','jm-field '+additionalClass);
    box.dataset.field=question.name;
    const label=elem('label','jm-label',question.name==='Fecha de nacimiento'?'Fecha de nacimiento':question.title);
    label.append(required(question));
    box.append(label);
    return {box,label};
  }
  function smallHelp(parent,text) {parent.append(elem('p','jm-hint',text));}
  function addDate(form,q) {
    const {box,label}=fieldBox(q);
    const control=elem('input','jm-input');
    control.type='date';control.name=q.name;control.id='jm-birthdate';
    const today = new Date();
    control.max=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    control.min='1900-01-01';control.required=q.isRequired;
    label.htmlFor=control.id;
    box.append(control);
    smallHelp(box,'Selecciona tu fecha de nacimiento en el calendario.');
    form.append(box);
  }
  function addSelect(form,q,placeholder,filterable=false) {
    const {box,label}=fieldBox(q);
    const control=elem('select','jm-select');
    control.id='jm-'+(q.name==='Estado de la República'?'state':'education');
    control.name=q.name; control.required=!!q.isRequired;
    label.htmlFor=control.id;
    control.append(new Option(placeholder,''));
    q.choices.forEach(choice => control.append(new Option(labelOf(choice),valueOf(choice))));
    box.append(control);
    if (q.name==='Estado de la República')smallHelp(box,'Selecciona la entidad donde has vivido la mayor parte del tiempo.');
    form.append(box);return {box,control};
  }
  function addRadios(form,q,questionHelp) {
    const {box,label}=fieldBox(q);
    const options=elem('div','jm-options');
    q.choices.forEach((choice,i)=>{
      const fieldLabel=elem('label','jm-option');
      const input=elem('input','jm-radio'); input.type='radio'; input.name=q.name;
      input.value=valueOf(choice);input.id='jm-'+q.name.replaceAll(' ','-')+'-'+i;
      input.required=!!q.isRequired;
      fieldLabel.append(input,elem('span','jm-option-text',labelOf(choice)));
      options.append(fieldLabel);
    });
    label.removeAttribute('for');
    box.append(options);
    if(questionHelp)smallHelp(box,questionHelp);
    form.append(box);
  }
  function addYesNo(form,q) {
    const {box,label}=fieldBox(q);
    const area=elem('div','jm-options jm-binary');
    [['Sí','true'],['No','false']].forEach(([text,value],i)=>{
      const fieldLabel=elem('label','jm-option');
      const input=elem('input','jm-radio');input.type='radio';input.name=q.name;
      input.value=value;input.required=!!q.isRequired;
      fieldLabel.append(input,elem('span','jm-option-text',text));area.append(fieldLabel);
    });
    box.append(area);form.append(box);
  }
  function explainErrors(form,missing) {
    const box=form.querySelector('.jm-error');
    box.textContent='Revisa las preguntas obligatorias: '+missing.join(', ')+'.';
    box.hidden=false;
    const first=form.querySelector('[data-field="'+missing[0]+'"]');
    if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.querySelector('input,select')?.focus({preventScroll:true});}
  }
  function collect(q,form) {
    const response={}, missing=[];
    for(const item of q) {
      const name=item.name;
      if(item.type==='text' && name==='Fecha de nacimiento') {
        const raw=form.elements.namedItem(name)?.value ?? '';
        // En ISO: formato univoco para analisis y conversion posterior.
        const date= /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw+'T12:00:00') : null;
        const today = new Date();
        const todayISO = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
        if (!date || Number.isNaN(date.getTime()) || raw > todayISO || raw < '1900-01-01')
          missing.push(item.title);
        else response[name]=raw;
      } else if(name==='Estudios' || name==='Estado de la República') {
        const selected=form.elements.namedItem(name)?.value || '';
        if (!selected && item.isRequired && (name!=='Estado de la República' || form.querySelector('input[name="Mayoría de vida en México"][value="true"]')?.checked)) missing.push(item.title);
        else if(selected) response[name]=selected;
      } else if(item.type==='radiogroup') {
        const checked=form.querySelector('input[name="'+name+'"]:checked');
        if(!checked && item.isRequired)missing.push(item.title);
        else if(checked)response[name]=checked.value;
      } else if(item.type==='boolean') {
        const checked=form.querySelector('input[name="'+name+'"]:checked');
        if(!checked && item.isRequired)missing.push(item.title);
        else if(checked)response[name]=checked.value==='true';
      } else if(item.type==='dropdown') {
        const selected=form.elements.namedItem(name)?.value || '';
        if (!selected && item.isRequired) missing.push(item.title);
        else if(selected)response[name]=selected;
      } else { throw Error('Tipo de pregunta inesperado: '+item.type); }
    }
    // El Estado se solicita solo si se ha vivido principalmente en Mexico.
    if(response['Mayoría de vida en México'] !== true) {
      delete response['Estado de la República'];
      const idx=missing.indexOf('¿En qué Estado de la República?');
      if(idx>=0)missing.splice(idx,1);
    }
    return {response,missing};
  }

  function install(timeline) {
    const {node,row,questions} = getSource(timeline);
    const previousFinish=node.on_finish;
    class SurveyNativePlugin {
      static info={name:'juicios-survey-nativo',version:'11.0',parameters:{}};
      constructor(jsPsych){this.jsPsych=jsPsych;}
      trial(display) {
        const started=performance.now();
        display.innerHTML='';
        const root=elem('main');root.id='juicios-survey';root.lang='es-MX';
        const card=elem('article','jm-card');
        const header=elem('header','jm-header');
        header.append(elem('span','','Facultad de Psicología · UNAM'),elem('span','','Cuestionario inicial'));
        const form=elem('form','jm-form'); form.noValidate=true;
        const scroll=elem('div','jm-scroll');
        const intro=elem('div','jm-intro');
        intro.append(elem('p','jm-eyebrow','Antes de comenzar'));
        intro.append(elem('h1','jm-title','Datos generales'));
        intro.append(elem('p','jm-lead','Responde algunas preguntas sobre ti. Esta información se utilizará únicamente con fines de investigación.'));
        intro.append(elem('p','jm-sublead','Los campos marcados con * son obligatorios.'));
        scroll.append(intro);

        const personal=section(scroll,'Información personal');
        const first=elem('div','jm-grid jm-grid-personal');personal.append(first);
        addDate(first,questions[0]);
        addRadios(first,questions[1]);
        addRadios(first,questions[2]);
        const study=section(scroll,'Formación académica');
        const edu={...questions[3],type:'dropdown'};
        addSelect(study,edu,'Selecciona tu nivel de estudios');
        const residency=section(scroll,'Lugar de residencia');
        addYesNo(residency,questions[4]);
        const state={...questions[5],type:'dropdown'};
        const stateField=addSelect(residency,state,'Selecciona un estado');
        const updateState=()=>{
          const yes=form.querySelector('input[name="Mayoría de vida en México"][value="true"]');
          const visible=!!yes?.checked;
          stateField.box.hidden=!visible;
          stateField.control.required=visible;
          if(!visible)stateField.control.value='';
        };
        form.addEventListener('change',e=>{
          if(e.target.name==='Mayoría de vida en México')updateState();
        });
        const error=elem('div','jm-error');error.id='jm-validation';error.role='alert';error.hidden=true;
        scroll.append(error);
        const footer=elem('footer','jm-footer');
        footer.append(elem('span','jm-footer-info','Las respuestas se guardan al continuar.'));
        const submit=elem('button','jm-submit','Continuar');submit.type='submit';footer.append(submit);
        form.append(scroll,footer);card.append(header,form);root.append(card);display.append(root);
        updateState();
        diagnostics.rendered++;
        let done=false;
        form.addEventListener('submit',ev=>{
          ev.preventDefault();if(done)return;
          const {response,missing}=collect(questions,form);
          if(missing.length){diagnostics.invalid++;explainErrors(form,missing);return;}
          done=true;submit.disabled=true;error.hidden=true;
          const rect=card.getBoundingClientRect();
          const data={rt:Math.round(performance.now()-started),
            [row.response_components[0].name+'_type']:'SurveyComponent',
            [row.response_components[0].name+'_coordinates']:JSON.stringify({x:Math.round(rect.x),y:Math.round(rect.y)}),
            [row.response_components[0].name+'_size']:JSON.stringify({width:Math.round(rect.width),height:Math.round(rect.height)}),
            [row.response_components[0].name+'_response']:response};
          diagnostics.submitted++;diagnostics.lastKeys=Object.keys(response);
          this.jsPsych.finishTrial(data);
        });
      }
    }
    node.type=SurveyNativePlugin;
    delete node.components;delete node.response_components;
    node.on_finish=function(data){return previousFinish?.call(this,data);};
    diagnostics.installed=1;
  }
  win.JuiciosSurvey={install};
})(window,document);
