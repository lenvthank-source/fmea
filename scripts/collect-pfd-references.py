"""Inventory public PFD references without treating previews as editable downloads."""
import argparse, concurrent.futures, hashlib, json, re, urllib.request
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

GUIDE='https://creately.com/guides/what-is-a-process-flow-diagram/'
SYMBOLS='https://creately.com/guides/pfd-symbols/'
PAGES=[GUIDE,SYMBOLS,'https://creately.com/usage/process-flow-diagram-template/','https://creately.com/diagram-community/popular?term=process%20flow','https://creately.com/diagram-community/popular?term=pfd']
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.links=[];self.images=[];self.rows=[];self.heading='';self.headtag=None;self.text=[];self.row=None;self.cell=None;self.cells=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('h2','h3'):self.headtag=tag;self.text=[]
  if tag=='a' and a.get('href'):self.links.append({'href':a['href'],'text':a.get('aria-label','')})
  if tag=='img':self.images.append(a)
  if tag=='tr':self.row=[]
  if tag in ('td','th') and self.row is not None:self.cell=[]
 def handle_data(self,data):
  if self.headtag:self.text.append(data)
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag==self.headtag:self.heading=' '.join(''.join(self.text).split());self.headtag=None
  if tag in ('td','th') and self.cell is not None:self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if tag=='tr' and self.row is not None:
   if self.row:self.rows.append({'category':self.heading,'cells':self.row})
   self.row=None

def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'FMEApex-PFD-reference-review/1.0'})
 with urllib.request.urlopen(req,timeout=40) as r:return r.read(),r.headers.get('Content-Type',''),r.geturl()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('archive');args=ap.parse_args();out=Path(args.archive);out.mkdir(parents=True,exist_ok=True)
 pages=[];templates={};entries=[]
 def load(url):
  try:
   body,ct,final=fetch(url);html=body.decode('utf-8','replace');p=Page();p.feed(html)
   slug=hashlib.sha256(url.encode()).hexdigest()[:12];(out/(slug+'.html')).write_bytes(body)
   return {'url':url,'finalUrl':final,'status':'public-page','snapshot':slug+'.html','contentType':ct},p
  except Exception as e:return {'url':url,'status':'unavailable','reason':str(e)},None
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for info,p in pool.map(load,PAGES):
   pages.append(info)
   if not p:continue
   if info['url']==SYMBOLS:
    entries=[{'category':r['category'],'label':r['cells'][0],'description':r['cells'][1]} for r in p.rows if len(r['cells'])>=2 and r['cells'][0].lower()!='symbol']
   for link in p.links:
    url=urljoin(info['url'],link['href']);m=re.search(r'(?:/diagram/example/|tempId=)([A-Za-z0-9]+)',url)
    if m:
     key=m.group(1);item=templates.setdefault(key,{'templateId':key,'sourceUrl':'https://creately.com/diagram/example/'+key,'discoveredFrom':[],'downloadStatus':'not-yet-inspected','exports':[]})
     if info['url'] not in item['discoveredFrom']:item['discoveredFrom'].append(info['url'])
 def inspect(item):
  info,p=load(item['sourceUrl']);item['page']=info
  if not p:item['downloadStatus']='page-unavailable';return item
  item['title']=next((str(i.get('alt','')) for i in p.images if i.get('id')=='svg-content'),item['templateId'])
  item['relatedPfdLinks']=[urljoin(item['sourceUrl'],l['href']) for l in p.links if '/diagram/example/' in l['href'] and ('process-flow-diagram' in l['href'].lower() or '/pfd-' in l['href'].lower())]
  item['downloadStatus']='public-preview; editable export not exposed on public page'
  item['previewImages']=[{'src':urljoin(info.get('finalUrl',item['sourceUrl']),i.get('src','')),'alt':i.get('alt','')} for i in p.images if i.get('id')=='svg-content']
  for link in p.links:
   u=urljoin(item['sourceUrl'],link['href'])
   if re.search(r'\.(svg|pdf|png|jpg|jpeg|drawio|vsdx)(?:\?|$)',u,re.I):
    item['exports'].append({'url':u,'status':'public-link-unverified-format'})
  return item
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:items=list(pool.map(inspect,templates.values()))
 while True:
  discovered=[]
  for item in items:
   for link in item.get('relatedPfdLinks',[]):
    match=re.search(r'/diagram/example/([A-Za-z0-9]+)',link)
    if match and match[1] not in templates:
     new={'templateId':match[1],'sourceUrl':link,'discoveredFrom':[item['sourceUrl']],'downloadStatus':'not-yet-inspected','exports':[]};templates[match[1]]=new;discovered.append(new)
  if not discovered:break
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:items.extend(pool.map(inspect,discovered))
 def download_preview(item):
  title=item.get('title','').lower()
  included=any(k in title for k in ['process flow diagram','process flow','logistics']) and not any(k in title for k in ['business','procure','vendor','employee','purchase order','change management'])
  item['classification']='engineering-layout-reference' if included else 'excluded-unrelated-business-or-data-flow'
  item['industry']=next((label for key,label in [('lng','LNG'),('etp','Effluent treatment'),('ethanol','Ethanol production'),('cement','Cement production'),('sewage','Sewage treatment'),('water treatment','Water treatment'),('refinery','Refining'),('logistics','Logistics'),('chemical','Chemical engineering')] if key in title),'General process engineering' if included else 'Unrelated catalog result')
  item['nativeTemplateStatus']='No unauthenticated editable template download exposed; editor/account access not exercised'
  if not included:return item
  for index,image in enumerate(item.get('previewImages',[])):
   try:
    body,ct,final=fetch(image['src'])
    if 'svg' not in ct.lower() and b'<svg' not in body[:1000]:raise ValueError('Not an SVG preview')
    name=item['templateId']+f'-preview-{index}.svg';(out/name).write_bytes(body)
    item['exports'].append({'url':image['src'],'finalUrl':final,'format':'SVG','status':'downloaded-public-vector-preview','file':name,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'nativeEditableTemplate':False})
    item['downloadStatus']='downloaded-public-SVG-preview; native editable template unavailable'
   except Exception as error:item['exports'].append({'url':image['src'],'status':'unavailable','reason':str(error)})
  return item
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:items=list(pool.map(download_preview,items))
 result={'retrievedOn':'2026-10-20','scope':'Public guide, symbol guide, usage collection and catalog searches; dynamic UI pagination requires separate review','pages':pages,'templates':items,'symbolEntries':entries,'limitations':['HTML snapshots and image previews are not editable template exports.','No account creation, payment, proprietary asset reuse or hidden endpoint enumeration.']}
 (out/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'pages':len(pages),'templates':len(items),'symbolEntries':len(entries),'archive':str(out),'statuses':{x:sum(t['downloadStatus']==x for t in items) for x in set(t['downloadStatus'] for t in items)}},ensure_ascii=False))
if __name__=='__main__':main()
