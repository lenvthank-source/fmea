import { useParams } from 'react-router-dom';
import { findResource } from '../../components/site/public-content';
import { ResourceArticle } from '../../components/site/ResourceArticle';
import { PublicNotFound } from '../../components/site/PublicLayout';
export function BlogPostPage() {
 const { slug } = useParams();
 const resource = findResource('Journal', slug);
 return resource ? <ResourceArticle resource={resource} /> : <PublicNotFound />;
}
