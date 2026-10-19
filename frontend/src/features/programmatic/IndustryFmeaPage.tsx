import { useParams } from 'react-router-dom';
import { findResource } from '../../components/site/public-content';
import { ResourceArticle } from '../../components/site/ResourceArticle';
import { PublicNotFound } from '../../components/site/PublicLayout';
export function IndustryFmeaPage() {
 const { industry } = useParams();
 const resource = findResource('Industry', industry);
 return resource ? <ResourceArticle resource={resource} /> : <PublicNotFound />;
}
