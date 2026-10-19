import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { PublicCTA, PublicLayout } from './PublicLayout';
import { resources, resourcePath, sectionId, type PublicResource } from './public-content';

export function ResourceCard({ resource }: {resource: PublicResource}) {
 return <article className="public-resource"><span>{resource.category}</span><h2><Link to={resourcePath(resource)}>{resource.title}</Link></h2><p>{resource.summary}</p><Link className="public-link" to={resourcePath(resource)}>Read {resource.category.toLowerCase()}<ArrowUpRight size={15} aria-hidden="true" /></Link></article>;
}
export function ResourceArticle({ resource }: {resource: PublicResource}) {
 const root = resource.category === 'Journal' ? '/blog' : '/learn';
 return <PublicLayout title={resource.title} description={resource.summary} canonical={resourcePath(resource)} article>
  <nav className="public-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={12} aria-hidden="true" /><Link to={root}>{resource.category === 'Journal' ? 'Journal' : 'Resources'}</Link><ChevronRight size={12} aria-hidden="true" /><span>{resource.category}</span></nav>
  <header className="public-hero public-reading-header"><span className="public-kicker">{resource.category}</span><h1>{resource.title}</h1><p>{resource.summary}</p><div className="public-article-meta">FMEApex engineering notes · {Math.max(2,Math.ceil(resource.sections.reduce((total,section) => total + section.paragraphs.join(' ').split(/\s+/).length,0)/180))} min read</div></header>
  {resource.example && <div className="public-demo" style={{marginBottom:45}}><span className="public-kicker">Illustrative relationship</span><div className="public-chain" aria-label="Example engineering relationship">{resource.example.map((text,index) => <div key={text}><small>{['Context','Operation','Verification','Response'][index]}</small><strong>{text}</strong></div>)}</div><p>Simplified example. Review the real process, requirements, and controls before using it in an analysis.</p></div>}
  <div className="public-reading"><nav className="public-toc" aria-label="On this page"><strong>On this page</strong>{resource.sections.map(section => <a key={section.title} href={`#${sectionId(section.title)}`}>{section.title}</a>)}{Boolean(resource.sources?.length) && <a href="#references">References</a>}</nav>
   <article className="public-prose">
    {resource.sections.map(section => <section id={sectionId(section.title)} key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(text => <p key={text}>{text}</p>)}{section.points && <ul>{section.points.map(text => <li key={text}>{text}</li>)}</ul>}</section>)}
    {resource.comparison && <section><h2>Questions for your evaluation</h2><div className="public-table-wrap" tabIndex={0} role="region" aria-label="Comparison table"><table className="public-table"><thead><tr><th scope="col">Consideration</th><th scope="col">{resource.slug === 'excel-fmea' ? 'Spreadsheet workflow' : 'APIS IQ evaluation'}</th><th scope="col">FMEApex evaluation</th></tr></thead><tbody>{resource.comparison.map(row => <tr key={row[0]}>{row.map((cell,i) => i === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></section>}
    {resource.faqs && <section className="public-faq"><h2>Common questions</h2>{resource.faqs.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
    {Boolean(resource.sources?.length) && <section id="references" className="public-sources"><h2>References and scope</h2><p>Primary references provide context. Applicable editions, customer requirements, and the complete licensed standards govern detailed requirements.</p><ul>{resource.sources?.map(source => <li key={source.url}><a className="public-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} (opens in a new tab)</a></li>)}</ul></section>}
   </article>
  </div>
  <section className="public-section"><h2>Keep following the thread.</h2><div className="public-grid">{resource.related.map(slug => resources.find(item => item.slug === slug)).filter((item): item is PublicResource => Boolean(item)).map(item => <ResourceCard key={item.slug} resource={item} />)}</div></section><PublicCTA />
 </PublicLayout>;
}
