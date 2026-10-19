import { useParams } from 'react-router-dom';
import { findResource } from '../../components/site/public-content';
import { ResourceArticle } from '../../components/site/ResourceArticle';
import { PublicNotFound } from '../../components/site/PublicLayout';
export function GlossaryPage() {
 const { term } = useParams();
 const resource = findResource('Glossary', term);
 return resource ? <ResourceArticle resource={resource} /> : <PublicNotFound />;
}
