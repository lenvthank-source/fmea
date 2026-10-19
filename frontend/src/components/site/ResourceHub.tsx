import { useSearchParams } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { resources } from './public-content';
import { ResourceCard } from './ResourceArticle';

export function ResourceHub({ journal = false }: { journal?: boolean }) {
 const [params,setParams] = useSearchParams();
 const query = params.get('q') || '';
 const selected = params.get('category') || 'All';
 const categories = journal ? ['All'] : ['All','Guide','Industry','Comparison','Glossary'];
 const category = categories.includes(selected) ? selected : 'All';
 const available = resources.filter(item => journal ? item.category === 'Journal' : item.category !== 'Journal');
 const matches = available.filter(item => (category === 'All' || item.category === category) && `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(query.toLowerCase().trim()));
 const update = (key:string,value:string) => {
  const next = new URLSearchParams(params); if(value && value !== 'All') next.set(key,value); else next.delete(key); setParams(next,{replace:key === 'q'});
 };
 return <PublicLayout title={journal ? 'Engineering journal' : 'Engineering resources'} description={journal ? 'Practical notes on connected FMEA, process coverage, and control planning.' : 'Explore practical guides, industry examples, comparisons, and quality-engineering definitions.'} canonical={journal ? '/blog' : '/learn'}>
  <header className="public-hero"><span className="public-kicker">{journal ? 'From the engineering desk' : 'A shared engineering language'}</span><h1>{journal ? 'Good decisions need a clear line of reasoning.' : 'Understand the connections. Then put them to work.'}</h1><p>{journal ? 'Notes on the questions behind the workflow: what belongs in an analysis, how a missing link matters, and what a changed control really means.' : 'Start with the method, explore a practical application, or look up one term. Every resource brings the process, risk, and control back into context.'}</p></header>
  <section className="public-section" aria-label={journal ? 'Journal articles' : 'Resource library'}>
   <div className="public-toolbar"><label className="sr-only" htmlFor="resource-search">Search {journal ? 'journal' : 'resources'}</label><input id="resource-search" className="public-search" type="search" placeholder={journal ? 'Search engineering notes…' : 'Search guides, definitions, industries…'} value={query} onChange={event => update('q',event.target.value)} />
    {!journal && <div className="public-filters" aria-label="Resource category">{categories.map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => update('category',item)}>{item === 'All' ? 'All resources' : item === 'Industry' ? 'Industries' : item === 'Glossary' ? 'Glossary' : `${item}s`}</button>)}</div>}
   </div><p role="status" aria-live="polite">{matches.length} {matches.length === 1 ? 'resource' : 'resources'}{query ? ` matching “${query}”` : ''}</p>
   {matches.length ? <div className="public-grid">{matches.map(resource => <ResourceCard key={`${resource.category}-${resource.slug}`} resource={resource}/>)}</div> : <div className="public-empty"><h2>No matching resources.</h2><p>Try a broader term, or clear the search and category.</p><button type="button" className="story-button" onClick={() => setParams({})}>Show all resources</button></div>}
  </section>
 </PublicLayout>;
}
