"""Generate original FMEApex SVG symbols from a reviewed public name inventory.
Usage: python scripts/build-pfd-symbols.py <reference inventory.json>
The source supplies names only: geometry is original application notation, unverified
against complete ISO/ISA references. Identical generated JSON is shipped to both apps.
"""
import json,re,sys,hashlib
from pathlib import Path

def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def path(d):return f'<path d="{d}"/>'
def rect(x,y,w,h,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>'
def circle(x,y,r):return f'<circle cx="{x}" cy="{y}" r="{r}"/>'
def text(s,x=48,y=40,size=11):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif">{s}</text>'
def geometry(label,category):
 n=label.lower();g='';family=''
 if category=='Process annotation symbols':
  family='annotation';g=path('M4 18H72L92 36 72 54H4Z') if 'sheet' in n or 'interface' in n else path('M12 10H84V50H48L30 64V50H12Z') if 'callout' in n else path('M8 52L88 20M8 60H88')
 elif category=='Instrument symbols':
  family='instrument';g=circle(48,36,25)
  if 'remote' in n:g+=path('M24 36H72')
  if 'auxiliary' in n:g+=path('M24 30H72M24 42H72')
  if 'dashed' in n:g=g.replace('/>',' stroke-dasharray="4 3"/>')
  if 'digital' in n or 'computer' in n or 'plc' in n or 'operator' in n:g=rect(20,10,56,52)+path('M20 46H76')
  if 'thermo' in n:g=circle(48,51,9)+path('M44 44V14A4 4 0 0 1 52 14V44M48 46V24')
  elif 'flow' in n or 'venturi' in n or 'rotameter' in n:g+=path('M4 36H22M74 36H92M33 48L63 24')
  elif 'pressure' in n or 'gauge' in n:g+=path('M48 36L63 22M48 61V68')
  elif 'level' in n:g+=path('M32 46H64M34 39L40 35 46 39 52 35 58 39 64 35')
  elif 'and gate' in n:g=path('M22 12H48A24 24 0 0 1 48 60H22ZM4 24H22M4 48H22M72 36H92')
  elif 'or gate' in n:g=path('M20 12Q52 12 76 36Q52 60 20 60Q38 36 20 12ZM4 24H26M4 48H26M76 36H92')
  elif 'not gate' in n:g=path('M24 12L68 36 24 60Z')+circle(74,36,5)+path('M4 36H24M79 36H92')
 elif category=='Valve and fitting symbols' or 'valve' in n:
  family='valve';g=path('M4 36H22L70 16V56L22 16V56L70 36H92')
  if 'ball' in n:g=circle(48,36,18)+path('M4 36H30M66 36H92M35 23L61 49M48 18V4')
  elif 'check' in n:g=path('M4 36H22M22 18V54M22 18L69 48M70 18V54M70 36H92')
  elif 'butterfly' in n:g=circle(48,36,20)+path('M4 36H28M68 36H92M35 21L61 51M48 16V4')
  elif 'needle' in n:g+=path('M48 4V36M40 28L48 36 56 28')
  elif 'relief' in n:g+=path('M48 16V8L39 4 57 0')
  elif 'angle' in n:g=path('M4 36H30L48 18 66 36 48 54 30 36M48 54V68')
  elif 'way' in n or 'mixing' in n:g+=path('M48 36V68')
  elif 'powered' in n or 'motor' in n:g+=path('M48 16V10')+rect(38,0,20,12)+text('M',48,10,9)
  elif not 'valve' in n:
   family='fitting';g=path('M4 36H92')
   if 'cap' in n:g=path('M4 24H64V48H4M64 20V52')
   elif 'reducer' in n:g=path('M4 18H30L64 28H92M4 54H30L64 44H92')
   elif 'strainer' in n or 'separator' in n:g=path('M4 36H20L48 12 76 36 48 60 20 36M76 36H92M35 24L61 48')
   elif 'flange' in n:g+=path('M40 18V54M56 18V54')
   elif 'weld' in n:g+=path('M38 24L48 36 58 24M38 48L48 36 58 48')
   elif 'vent' in n:g=path('M4 54H48V12M36 24L48 12 60 24')
   elif 'joint' in n or 'sleeve' in n:g+=rect(32,24,32,24)
   elif 'silencer' in n:g=rect(20,16,56,40)+path('M4 36H20M76 36H92M30 22V50M40 22V50M50 22V50M60 22V50')
   else:g+=circle(48,36,14)
 elif category=='Vessel symbols' or any(k in n for k in ['tank','tower','drum','vessel','autoclave','kettle','column','clarifier','gas holder','barrel']):
  family='vessel';g=rect(24,8,48,56,10)+path('M4 36H24M72 36H92')
  if 'flat' in n:g=rect(24,8,48,56)
  if 'open' in n:g=path('M24 12V60H72V12M4 36H24M72 36H92')
  if 'sphere' in n:g=circle(48,34,25)+path('M32 55V68M64 55V68M4 34H23M73 34H92')
  if 'column' in n or 'tower' in n:g=rect(32,4,32,64,8)+path('M4 36H32M64 36H92')
  if 'tray' in n:g+=path('M34 18H62M34 28H62M34 40H62M34 51H62')
  if 'peaked' in n or 'fixed roof' in n:g=path('M24 20L48 4 72 20V60H24ZM4 36H24M72 36H92')
  if 'floating' in n:g+=path('M26 23H70M26 28H70')
  if 'sump' in n:g+=path('M39 60V69H57V60')
  if 'helical' in n:g+=path('M48 6V55M36 20L60 26 36 32 60 38 36 44 60 50')
  elif 'anchor' in n:g+=path('M48 6V52M34 42V52H62V42')
  elif 'propeller' in n or 'reaction' in n:g+=path('M48 6V52M34 37L62 51M34 51L62 37')
  if 'motor' in n:g+=rect(41,0,14,10)
  if 'water surface' in n:g=path('M8 30Q18 20 28 30T48 30T68 30T88 30M8 42Q18 32 28 42T48 42T68 42T88 42')
 elif category=='Pump symbols' or any(k in n for k in ['pump','compressor','blower','fan','turbine','ejector']):
  family='rotating';g=circle(48,36,24)+path('M4 36H24M72 36H92M32 20L64 36 32 52Z')
  if 'centrifugal' in n:g=circle(48,36,23)+path('M4 36H25M48 13H79V5M48 59H78V67M39 27L60 36 39 45Z')
  if 'gear' in n:g=circle(48,36,25)+circle(37,36,10)+circle(59,36,10)+path('M4 36H23M73 36H92')
  if 'screw' in n or 'helical' in n:g=rect(20,16,56,40,8)+path('M4 36H20M76 36H92M24 27L34 45 44 27 54 45 64 27 74 45')
  if 'piston' in n or 'reciprocating' in n:g=rect(24,18,48,36)+path('M4 36H48M48 20V52M72 36H92')
  if 'diaphragm' in n:g=circle(48,36,24)+path('M48 12Q28 36 48 60M4 36H24M72 36H92')
  if 'fan' in n or 'propeller' in n:g=circle(48,36,25)+circle(48,36,4)+path('M48 32Q20 4 30 28L44 38M52 36Q84 14 64 20L48 32M48 40Q60 70 62 48L52 36M4 36H23M73 36H92')
 elif category=='Heating equipment symbols' or any(k in n for k in ['exchanger','evaporator','condenser','cooler','heater','boiler']):
  family='thermal';g=circle(48,36,25)+path('M4 36H23M73 36H92M29 36L37 24 47 48 57 24 67 36')
  if 'shell' in n or 'tube' in n:g=rect(18,16,60,40,12)+path('M4 36H18M78 36H92M28 20V52M40 20V52M52 20V52M64 20V52')
  if 'plate' in n:g=rect(20,12,56,48)+path('M30 14V58M40 14V58M50 14V58M60 14V58M4 24H20M76 48H92')
  if 'fired' in n or 'burner' in n or 'stoker' in n:g=rect(24,8,48,52)+path('M36 52Q24 42 44 27Q40 43 52 31Q74 52 54 55M4 36H24M72 36H92')
 elif any(k in n for k in ['filter','screen']):
  family='separation';g=rect(22,12,52,48)+path('M4 36H22M74 36H92M25 55L70 17M25 43L57 15M38 57L71 29')
 elif any(k in n for k in ['conveyor','transport','loader','hoist','truck','car']):
  family='handling';g=rect(12,24,72,24,12)+circle(25,36,8)+circle(71,36,8)+path('M28 60H68M36 54L28 60 36 66M60 54L68 60 60 66')
  if 'hoist' in n:g=path('M12 12H84M48 12V42Q48 58 34 54Q22 50 30 42')+circle(48,21,7)
  if 'bucket' in n:g+=path('M24 48V60H40V48M56 48V60H72V48')
 elif any(k in n for k in ['mixer','blender','agitator','kneader','propeller']):
  family='mixing';g=path('M22 12V60H74V12M48 4V52M32 32L64 48M32 48L64 32M4 36H22M74 36H92')
 elif any(k in n for k in ['crusher','mill','press','breaker','centrifuge','cyclone','separator']):
  family='processing';g=rect(20,12,56,48)+circle(37,36,12)+circle(59,36,12)+path('M4 36H20M76 36H92')
  if 'cyclone' in n:g=path('M28 8H68V35L48 62 28 35ZM48 62V70M4 20H28M68 20H92')
  if 'jaw' in n:g=rect(20,12,56,48)+path('M28 18L44 54M68 18L52 54M4 36H20M76 36H92')
 else:
  family='process-equipment';g=rect(20,12,56,48,5)+path('M4 36H20M76 36H92')
 # All named variants retain their identity visibly. This is original application
 # notation and is explicitly NOT an assertion of ISO/ISA glyph conformance.
 token=''.join(w[0] for w in re.findall(r'[A-Za-z0-9]+',label))[:5].upper()
 if family not in ('annotation',):g+=text(token,48,70,7)
 return g,family

def main():
 source=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'));catalog=[];coverage=[];canonical={}
 ports={'north':[48,4],'east':[92,36],'south':[48,68],'west':[4,36]}
 def add(id,label,cat,kind,svg,**extra):
  catalog.append(dict(id=id,label=label,category=cat,kind=kind,aliases=[],viewBox='0 0 96 72',ports=ports,svg=svg,provenance='Original FMEApex geometry; public names used as visual reference',verificationStatus='application-notation-unverified',**extra))
 basics={
 'operation':circle(48,36,25),'inspection':rect(23,11,50,50),'transport':path('M4 25H58V10L92 36 58 62V47H4Z'),
 'storage':path('M14 12H82L48 62Z'),'delay':path('M20 12H48A24 24 0 0 1 48 60H20Z'),
 'decision':path('M48 4L92 36 48 68 4 36Z'),'combined':rect(23,11,50,50)+circle(48,36,20),
 'rework':circle(48,36,25)+text('RW'),'repair':rect(20,12,56,48)+text('RP'),
 'hold':rect(20,12,56,48)+text('HOLD',48,40,10),'scrap':path('M25 12L71 60M71 12L25 60')+rect(20,8,56,56),
 'return':path('M82 54V30H26M26 30L42 14M26 30L42 46')}
 for k,g in basics.items():add('manufacturing.'+k,k.title(),'Manufacturing activities','manufacturing',g,activityTypes=[k])
 shapes={'rectangle':rect(8,10,80,52),'rounded-rectangle':rect(8,10,80,52,10),'ellipse':'<ellipse cx="48" cy="36" rx="42" ry="27"/>','triangle':path('M48 4L92 66H4Z'),'diamond':path('M48 4L92 36 48 68 4 36Z'),'parallelogram':path('M20 10H92L76 62H4Z'),'document':path('M10 8H86V55Q66 45 48 57Q28 68 10 58Z'),'database':path('M16 16V56C16 70 80 70 80 56V16M16 16C16 2 80 2 80 16C80 30 16 30 16 16M16 51C16 65 80 65 80 51'),'terminator':rect(4,16,88,40,20),'connector':circle(48,36,20),'off-page':path('M16 8H80V42L48 66 16 42Z'),'callout':path('M8 8H88V50H46L24 66V50H8Z'),'table':rect(8,8,80,56)+path('M8 24H88M8 40H88M32 8V64M60 8V64')}
 for k,g in shapes.items():add('basic.'+k,k.replace('-',' ').title(),'Basic shapes','basic',g)
 for k,g in {'right':path('M4 24H62V10L92 36 62 62V48H4Z'),'left':path('M92 24H34V10L4 36 34 62V48H92Z'),'up':path('M36 68V28H20L48 4 76 28H60V68Z'),'down':path('M36 4V44H20L48 68 76 44H60V4Z'),'bidirectional':path('M4 36L28 12V25H68V12L92 36 68 60V47H28V60Z'),'chevron':path('M12 8H50L84 36 50 64H12L44 36Z'),'bent':path('M10 66V26H62V10L90 36 62 62V46H30V66Z'),'uturn':path('M16 66V28C16 -4 80 -4 80 28V42H92L68 66 44 42H56V28C56 16 40 16 40 28V66Z')}.items():add('arrow.'+k,k.replace('-',' ').title()+' arrow','Arrows','arrow',g)
 # Arrow families visible in the supplied browser reference, authored as
 # annotation glyphs; their geometry never creates process connectivity.
 extra_arrows={
 'vertical-bidirectional':path('M48 4L68 24H58V48H68L48 68 28 48H38V24H28Z'),
 'four-way':path('M48 4L62 20H56V28H70V20L92 36 70 52V44H56V52H62L48 68 34 52H40V44H26V52L4 36 26 20V28H40V20H34Z'),
 'three-way':path('M48 4L64 24H56V28H72V18L92 36 72 54V44H24V54L4 36 24 18V28H40V24H32Z'),
 'split-left-right':path('M40 68V42H26V52L4 34 26 16V26H70V16L92 34 70 52V42H56V68Z'),
 'bent-left':path('M86 66V26H34V10L6 36 34 62V46H66V66Z'),
 'bent-up':path('M4 48H38V28H24L48 4 72 28H58V68H4Z'),
 'bent-down':path('M4 24H38V44H24L48 68 72 44H58V4H4Z'),
 'elbow-right':path('M8 8H32V24H62V10L92 36 62 62V48H8Z'),
 'elbow-left':path('M88 8H64V24H34V10L4 36 34 62V48H88Z'),
 'curved-right':path('M8 62Q8 20 62 20V6L92 32 62 58V44Q30 44 30 62Z'),
 'curved-left':path('M88 62Q88 20 34 20V6L4 32 34 58V44Q66 44 66 62Z'),
 'curved-down':path('M8 8Q70 8 70 44H84L58 68 32 44H46Q46 30 8 30Z'),
 'curved-up':path('M8 64Q70 64 70 28H84L58 4 32 28H46Q46 42 8 42Z'),
 'uturn-left':path('M80 66V28C80 -4 16 -4 16 28V42H4L28 66 52 42H40V28C40 16 56 16 56 28V66Z'),
 'double-chevron':path('M4 8H26L54 36 26 64H4L32 36ZM42 8H64L92 36 64 64H42L70 36Z'),
 'left-chevron':path('M84 8H46L12 36 46 64H84L52 36Z'),
 'notched-right':path('M4 24H62V10L92 36 62 62V48H4L18 36Z'),
 'notched-left':path('M92 24H34V10L4 36 34 62V48H92L78 36Z'),
 'striped-right':path('M28 24H62V10L92 36 62 62V48H28ZM18 24H23V48H18ZM8 24H12V48H8Z'),
 'striped-left':path('M68 24H34V10L4 36 34 62V48H68ZM73 24H78V48H73ZM84 24H88V48H84Z'),
 'thin-right':path('M4 32H70V22L92 36 70 50V40H4Z'),
 'thin-left':path('M92 32H26V22L4 36 26 50V40H92Z')}
 for k,g in extra_arrows.items():add('arrow.'+k,k.replace('-',' ').title()+' arrow','Arrows','arrow',g)
 for row in source['symbolEntries']:
  name=row['label'];normalized=re.sub(r'\s*\(duplicate\)','',name,flags=re.I).strip().lower()
  if normalized in canonical:
   id=canonical[normalized];target=next(x for x in catalog if x['id']==id);target['aliases'].append(row['category']+': '+name)
   coverage.append({'category':row['category'],'label':name,'symbolId':id,'mapping':'duplicate-name alias','verificationStatus':'application-notation-unverified'});continue
  category=row['category'];g,family=geometry(name,category);id=('annotation.' if category=='Process annotation symbols' else 'engineering.')+slug(name)
  canonical[normalized]=id
  existing=next((x for x in catalog if x['id']==id),None)
  if existing:
   existing['aliases'].append(category+': '+name)
   coverage.append({'category':category,'label':name,'symbolId':id,'mapping':'punctuation-equivalent alias','verificationStatus':'application-notation-unverified'});continue
  add(id,name,category.replace(' symbols','').title(),'annotation' if category=='Process annotation symbols' else 'engineering',g,family=family)
  coverage.append({'category':category,'label':name,'symbolId':id,'mapping':'original application glyph','verificationStatus':'application-notation-unverified'})
 data=json.dumps(catalog,ensure_ascii=False,indent=2)+'\n'
 for pathName in ['frontend/src/features/pfd/symbols/pfd-symbols.json','backend/src/modules/pfd/pfd-symbols.json']:Path(pathName).write_bytes(data.encode('utf-8'))
 manifest={'source':'https://creately.com/guides/pfd-symbols/','retrievedOn':'2026-10-20','sourceEntryCount':len(coverage),'registeredSymbolCount':len(catalog),'catalogSha256':hashlib.sha256(data.encode()).hexdigest(),'status':'All public names mapped; original application geometry, NOT independently standards-verified','entries':coverage}
 Path('docs/references/pfd-symbol-coverage.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Generated {len(catalog)} original registry symbols; {len(coverage)} source entries accounted for; identical backend/frontend catalogs.')
if __name__=='__main__':main()
