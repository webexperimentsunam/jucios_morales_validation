/* Juicios Morales v12: Cuestionario sociodemografico como ensayo nativo de jsPsych.
   Conserva el trial_id y las claves originales y anade escolaridad por grados aprobados. */
(function (win, doc) {
  'use strict';
  const diagnostics = { version:'17.0-estudios-formales', installed:0, rendered:0, submitted:0,
    invalid:0, lastError:null, lastKeys:[] };
  win.JuiciosSurveyDiagnostics = diagnostics;

  // Los anios se miden por ciclos/grados COMPLETOS aprobados, no por tiempo inscrito.
  // Los estudios de otra(s) licenciatura(s) se guardan por separado para no inflar
  // automaticamente los anios de la trayectoria principal usados en baremos.
  const SCHOOL_YEARS = [
    { name:'Años aprobados - Primaria', label:'Primaria', max:6 },
    { name:'Años aprobados - Secundaria', label:'Secundaria', max:6 },
    { name:'Años aprobados - Bachillerato', label:'Bachillerato o equivalente', max:6 },
    { name:'Años aprobados - Licenciatura principal', label:'Licenciatura principal', max:12 },
    { name:'Años aprobados - Especialidad', label:'Especialidad', max:6 },
    { name:'Años aprobados - Maestría', label:'Maestría', max:6 },
    { name:'Años aprobados - Doctorado', label:'Doctorado', max:10 }
  ];

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

  function addSchoolYears(form) {
    smallHelp(form,'Indica cuántos años o grados COMPLETOS aprobaste en cada nivel. Escribe 0 si no lo cursaste o no aprobaste ningún grado. No cuentes ciclos reprobados, repetidos ni tiempo adicional por cursar menos materias.');
    const grid=elem('div','jm-grid jm-grid-school-years');
    for (const spec of SCHOOL_YEARS) {
      const box=elem('div','jm-field jm-year-field');
      box.dataset.field=spec.name;
      const id='jm-school-'+SCHOOL_YEARS.indexOf(spec);
      const label=elem('label','jm-label',spec.label);
      label.htmlFor=id;
      label.append(elem('span','jm-required',' *'));
      const control=elem('input','jm-input jm-input-year');
      control.id=id;control.name=spec.name;control.type='number';
      control.min='0';control.max=String(spec.max);control.step='1';
      control.inputMode='numeric';control.required=true;control.placeholder='0';
      box.append(label,control);
      grid.append(box);
    }
    form.append(grid);
    smallHelp(form,'Ejemplo: si terminaste un programa de cuatro años en ocho años calendario, registra 4. Los otros programas formales se indican en la siguiente sección.');
  }

  function collectSchoolYears(form) {
    const response={},missing=[];
    for (const spec of SCHOOL_YEARS) {
      const raw=form.elements.namedItem(spec.name)?.value?.trim() ?? '';
      const value=Number(raw);
      if(raw===''||!Number.isInteger(value)||value<0||value>spec.max){
        missing.push(spec.name);
      }else{
        response[spec.name]=value;
      }
    }
    if(!missing.length) {
      response['Años de escolaridad - trayectoria principal'] = SCHOOL_YEARS
        .reduce((sum,spec)=>sum+response[spec.name],0);
      response['Criterio de años de escolaridad'] = 'Años o grados completos aprobados, sin contar repetidos';
    }
    return {response,missing};
  }
  const ADDITIONAL_LEVELS=['Primaria','Secundaria','Bachillerato','Técnico superior / TSU','Licenciatura','Especialidad','Maestría','Doctorado','Otro estudio formal'];
  const MAX_ADDITIONAL=8;
  function addAdditionalProgram(container) {
    const cards=container.querySelector('.jm-additional-cards');
    if(cards.children.length>=MAX_ADDITIONAL)return;
    const index=cards.children.length+1;
    const card=elem('fieldset','jm-additional-card');card.dataset.program=String(index);
    const legend=elem('legend','jm-additional-legend','Programa adicional '+index);card.append(legend);
    const fields=elem('div','jm-additional-fields');
    const levelBox=elem('div','jm-field');
    const levelLabel=elem('label','jm-label','Nivel educativo');
    const level=elem('select','jm-select');level.name='additional-level-'+index;level.required=true;
    level.append(new Option('Selecciona un nivel',''));
    for(const name of ADDITIONAL_LEVELS)level.append(new Option(name,name));
    levelLabel.htmlFor='additional-level-'+index;level.id=levelLabel.htmlFor;levelBox.append(levelLabel,level);fields.append(levelBox);
    const yearsBox=elem('div','jm-field');
    const yearsLabel=elem('label','jm-label','Años o grados completos');
    const years=elem('input','jm-input');years.id='additional-years-'+index;years.name=years.id;
    years.type='number';years.min='0';years.max='30';years.step='1';years.required=true;
    years.inputMode='numeric';yearsLabel.htmlFor=years.id;yearsBox.append(yearsLabel,years);fields.append(yearsBox);
    const finishedBox=elem('div','jm-field');
    const finishedLabel=elem('label','jm-label','¿Concluiste este programa?');
    const finished=elem('select','jm-select');finished.name='additional-finished-'+index;finished.id=finished.name;
    finished.append(new Option('Selecciona una respuesta',''),new Option('Sí','true'),new Option('No','false'));
    finished.required=true;finishedLabel.htmlFor=finished.id;finishedBox.append(finishedLabel,finished);fields.append(finishedBox);
    card.append(fields);
    const remove=elem('button','jm-remove-additional','Quitar programa');remove.type='button';
    remove.addEventListener('click',()=>{card.remove();reindexAdditional(cards);});card.append(remove);
    cards.append(card);
  }
  function reindexAdditional(cards){
    Array.from(cards.children).forEach((card,i)=>{
      const num=i+1;card.dataset.program=String(num);card.querySelector('legend').textContent='Programa adicional '+num;
      const controls=card.querySelectorAll('select,input');
      const types=['additional-level-','additional-years-','additional-finished-'];
      controls.forEach((c,j)=>{c.id=types[j]+num;c.name=c.id;});
      card.querySelectorAll('label').forEach((label,j)=>label.htmlFor=types[j]+num);
    });
  }
  function addAdditionalStudies(sectionEl){
    smallHelp(sectionEl,'Registra únicamente otros programas de educación formal, por ejemplo otra licenciatura, especialidad, maestría o doctorado. No incluyas cursos, talleres, diplomados de educación continua ni estudios ya anotados arriba.');
    const yesNo=elem('div','jm-options jm-binary');
    for(const [text,value] of [['Sí','si'],['No','no']]){
      const wrap=elem('label','jm-option');const input=elem('input','jm-radio');input.type='radio';input.name='has-additional';input.value=value;input.required=true;
      wrap.append(input,elem('span','',text));yesNo.append(wrap);
    }
    const prompt=elem('p','jm-label','¿Has cursado otros programas formales adicionales?');sectionEl.append(prompt,yesNo);
    const panel=elem('div','jm-additional-panel');panel.hidden=true;
    const cards=elem('div','jm-additional-cards');panel.append(cards);
    const add=elem('button','jm-add-additional','+ Agregar otro programa');add.type='button';
    add.addEventListener('click',()=>addAdditionalProgram(panel));panel.append(add);sectionEl.append(panel);
    yesNo.addEventListener('change',()=>{
      panel.hidden=sectionEl.querySelector('input[name="has-additional"]:checked')?.value!=='si';
      if(!panel.hidden && !cards.children.length)addAdditionalProgram(panel);
      if(panel.hidden)cards.replaceChildren();
    });
  }
  function collectAdditional(form){
    const answer=form.querySelector('input[name="has-additional"]:checked')?.value;
    const response={},missing=[],programs=[];
    if(!answer){missing.push('Estudios adicionales');return {response,missing};}
    if(answer==='si'){
      const cards=form.querySelectorAll('.jm-additional-card');
      if(!cards.length)missing.push('Agrega al menos un programa adicional');
      cards.forEach((card,index)=>{
        const no=index+1;
        const level=card.querySelector('[name="additional-level-'+no+'"]')?.value || '';
        const raw=card.querySelector('[name="additional-years-'+no+'"]')?.value ?? '';
        const finished=card.querySelector('[name="additional-finished-'+no+'"]')?.value || '';
        const years=Number(raw);
        if(!ADDITIONAL_LEVELS.includes(level)||raw===''||!Number.isInteger(years)||years<0||years>30||!['true','false'].includes(finished))
          missing.push('Programa adicional '+no);
        else programs.push({nivel:level,anios_aprobados:years,concluido:finished==='true'});
      });
    }
    if(!missing.length){
      response['Otros estudios formales']=programs.length>0;
      response['Otros estudios formales - número de programas']=programs.length;
      response['Otros estudios formales - programas']=JSON.stringify(programs);
      response['Otros estudios formales - años aprobados']=programs.reduce((sum,p)=>sum+p.anios_aprobados,0);
      // Columnas individuales para facilitar revisión en el CSV sin depender del JSON.
      programs.forEach((p,i)=>{
        const j=i+1;response['Programa adicional '+j+' - nivel']=p.nivel;
        response['Programa adicional '+j+' - años']=p.anios_aprobados;
        response['Programa adicional '+j+' - concluido']=p.concluido;
      });
    }
    return {response,missing};
  }
  function deriveEducation(years,highestCompleted,additionalPrograms=[]){
    const order=[['Doctorado','Doctorado'],['Maestría','Maestria'],['Especialidad','Especialidad'],
      ['Licenciatura principal','Licenciatura'],['Bachillerato','Bachillerato'],
      ['Secundaria','Secundaria'],['Primaria','Primaria']];
    const level=order.find(([label])=>years['Años aprobados - '+label]>0);
    const orderLevel=order.map((item)=>item[1]);
    let selected=level?{nivel:level[1],concluido:highestCompleted}:null;
    for(const program of additionalPrograms){
      const normalized=program.nivel==='Maestría'?'Maestria':program.nivel;
      const rank=orderLevel.indexOf(normalized);
      if(rank<0)continue; // TSU/otros programas no se equiparan automáticamente.
      const previousRank=selected?orderLevel.indexOf(selected.nivel):Infinity;
      if(!selected || rank<previousRank || (rank===previousRank && program.concluido && !selected.concluido))
        selected={nivel:normalized,concluido:program.concluido};
    }
    if(!selected)return {label:'Sin escolaridad formal',highest:'Sin escolaridad formal'};
    let suffix=selected.concluido?'completa':'incompleta';
    if(['Doctorado','Bachillerato'].includes(selected.nivel))suffix=selected.concluido?'completo':'incompleto';
    return {label:selected.nivel+' ('+suffix+')',highest:selected.nivel};
  }
  function addHighestCompleted(sectionEl){
    const field=elem('div','jm-field jm-highest-finished');
    field.append(elem('p','jm-label','¿Concluiste el nivel educativo más alto que registraste?'));
    smallHelp(field,'Responde Sí si concluiste el programa correspondiente, aunque hayas tardado más años. Si no cursaste educación formal, selecciona «No aplica».');
    const select=elem('select','jm-select');select.id='jm-highest-completed';select.name='jm-highest-completed';select.required=true;
    select.append(new Option('Selecciona una respuesta',''),new Option('Sí','si'),new Option('No','no'),new Option('No aplica (sin escolaridad)','na'));
    field.append(select);sectionEl.append(field);
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
    box.textContent='Revisa estas preguntas: '+missing.join(', ')+'. Los años deben ser números enteros dentro del rango indicado.';
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
      } else if(name==='Estudios') {
        // Derivado de la escolaridad y el estado de finalización, no se pregunta dos veces.
        continue;
      } else if(name==='Estado de la República') {
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
      static info={name:'juicios-survey-nativo',version:'12.0',parameters:{}};
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
        const schoolYears=section(scroll,'Años de escolaridad aprobados');
        addSchoolYears(schoolYears);
        addHighestCompleted(schoolYears);
        const additional=section(scroll,'Otros estudios formales');
        addAdditionalStudies(additional);
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
          const years=collectSchoolYears(form);
          missing.push(...years.missing);
          const additional=collectAdditional(form);
          missing.push(...additional.missing);
          const highest=form.elements.namedItem('jm-highest-completed')?.value || '';
          if(!highest)missing.push('Conclusión del nivel más alto');
          if(!years.missing.length && highest){
            const total=years.response['Años de escolaridad - trayectoria principal'];
            if((total===0 && highest!=='na')||(total>0 && highest==='na'))missing.push('Conclusión del nivel más alto');
          }
          if(missing.length){diagnostics.invalid++;explainErrors(form,missing);return;}
          Object.assign(response,years.response,additional.response);
          const additionalPrograms=JSON.parse(additional.response['Otros estudios formales - programas']||'[]');
          const derived=deriveEducation(years.response,highest==='si',additionalPrograms);
          response['Estudios']=derived.label;
          response['Nivel más alto - derivado']=derived.highest;
          response['Nivel principal más alto - concluido']=highest==='na'?null:highest==='si';
          response['Nivel más alto - concluido']=derived.label.includes('(complet');
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
