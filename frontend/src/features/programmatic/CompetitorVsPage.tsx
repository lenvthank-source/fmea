import { useParams } from 'react-router-dom';
import { findResource } from '../../components/site/public-content';
import { ResourceArticle } from '../../components/site/ResourceArticle';
import { PublicNotFound } from '../../components/site/PublicLayout';
export function CompetitorVsPage() {
 const { competitor } = useParams();
 const resource = findResource('Comparison', competitor);
 return resource ? <ResourceArticle resource={resource} /> : <PublicNotFound />;
}
