#!/usr/bin/env python3
"""Auditoría orientativa para CSV de Validación (no acredita ni invalida automáticamente).
Uso: python revisar_participaciones.py respuestas.csv [resumen.csv]
"""
from __future__ import annotations
import csv, sys, statistics
from collections import defaultdict
from pathlib import Path

COLUMNS = [
    'codigo_participacion','curso','modalidad','sessionId','filas_principales',
    'estimulos_distintos','esperados','cuatro_escalas_completas','porcentaje_respuestas_completas',
    'mediana_rt_ms','respuestas_menores_400ms','sd_moralidad','sd_competencia',
    'sd_informatividad','sd_credibilidad','indicadores_para_revision'
]
SCALES = ('Moralidad','Competencia','Informatividad','Credibilidad')
def parse_num(raw):
    try:return float(str(raw).strip())
    except (TypeError,ValueError):return None

def build(rows):
    by_key=defaultdict(list)
    for row in rows:
        code=(row.get('vm_codigo_participacion') or '').strip()
        mode=(row.get('vm_modalidad') or '').strip()
        if mode != 'estudiante' or not code:continue
        by_key[(code,row.get('sessionId',''))].append(row)
    reports=[]
    for (code,sid),rs in by_key.items():
        main=[r for r in rs if r.get('trial_name') == 'Behavioral Statements']
        distinct={r.get('stimulus_id') for r in main if r.get('stimulus_id')}
        expected=3 if code.startswith('PRUEBA-') else 80
        completed=[];scales={s:[] for s in SCALES};rt=[]
        for r in main:
            vals={s:parse_num(r.get(s+'_response')) for s in SCALES}
            valid=all(vals[s] is not None and ( (-4 <= vals[s] <= 4) if s in SCALES[:2] else (0 <= vals[s] <= 8)) for s in SCALES)
            completed.append(valid)
            if valid:
                for s,v in vals.items():scales[s].append(v)
            t=parse_num(r.get('rt'))
            if t is not None and t>=0:rt.append(t)
        sdev={s:(round(statistics.pstdev(v),3) if len(v)>1 else None) for s,v in scales.items()}
        notes=[]
        if len(distinct)<expected:notes.append('Menos ensayos únicos de los esperados')
        if len(main)!=len(distinct):notes.append('Revisar eventos de estímulos repetidos')
        if not all(completed):notes.append('Faltan respuestas válidas en alguna escala')
        if rt and sum(t<400 for t in rt)>=max(3,len(rt)*.25):notes.append('Muchos tiempos de reacción inferiores a 400 ms')
        if any(v is not None and v == 0 for v in sdev.values()):notes.append('Variabilidad cero en al menos una dimensión')
        if code.startswith('PRUEBA-'):notes.append('Código de prueba: no acredita')
        reports.append({
            'codigo_participacion':code,'curso':rs[0].get('vm_curso',''),
            'modalidad':'estudiante','sessionId':sid,'filas_principales':len(main),
            'estimulos_distintos':len(distinct),'esperados':expected,
            'cuatro_escalas_completas':sum(completed),
            'porcentaje_respuestas_completas':round(100*sum(completed)/len(main),1) if main else 0,
            'mediana_rt_ms':round(statistics.median(rt)) if rt else '',
            'respuestas_menores_400ms':sum(t<400 for t in rt),
            **{'sd_'+s.lower():sdev[s] if sdev[s] is not None else '' for s in SCALES},
            'indicadores_para_revision':'; '.join(notes) if notes else 'Sin alertas automáticas; revisar igualmente'
        })
    return reports

def main():
    if len(sys.argv)<2:sys.exit('Uso: python revisar_participaciones.py respuestas.csv [resumen.csv]')
    src=Path(sys.argv[1]);dest=Path(sys.argv[2]) if len(sys.argv)>2 else src.with_name(src.stem+'_revision.csv')
    with src.open(encoding='utf-8-sig',newline='') as f:reports=build(csv.DictReader(f))
    with dest.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=COLUMNS);writer.writeheader();writer.writerows(reports)
    print(f'Resultados de {len(reports)} sesiones de estudiantes en {dest}')
    print('Las alertas son orientativas; requieren revisión humana. No se otorgan puntos automáticamente.')
if __name__=='__main__':main()
