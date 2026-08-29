import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Chip, Button } from '@mui/material';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { API_BASE_URL } from '../../config';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    let c=false;
    (async()=>{
      try{
        const r=await fetch(`${API_BASE_URL}/cms/blog/posts/${slug}`);
        if(r.ok){ const j=await r.json(); if(!c) setPost(j.data||j); }
      }catch{}
      if(!c) setLoading(false);
    })(); return ()=>{c=true;};
  },[slug]);

  const title = post?.title || slug?.replace(/-/g,' ') || 'Post';
  const fallback = !post && !loading;

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <SEO title={`${title} — FMEApex Blog`} description={post?.excerpt || 'FMEApex blog post — headless CMS.'} canonical={`/blog/${slug}`} jsonLd={{ '@context':'https://schema.org','@type':'BlogPosting', headline: title, datePublished: post?.date || '2026-07-20', author: { '@type': 'Organization', name: 'FMEApex' } }} />
      <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 6 }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>{title}</Typography>
          {post && <Chip label={post.badge||'Blog'} size="small" sx={{ mt: 1, bgcolor: 'rgba(13,148,136,0.2)', color: '#fff' }} />}
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, fontSize: '0.85rem' }}>{post?.date ? `${post.date} · ${post.author||'FMEApex Team'}` : 'Headless CMS — POST /cms/blog/publish from n8n'}</Typography>
        </Container>
      </Box>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
          {post ? (
            <Box sx={{ '& p': { lineHeight: 1.7, color: 'text.secondary', fontSize: '0.95rem' } }}>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{post.content || post.excerpt}</Typography>
            </Box>
          ) : fallback ? (
            <Typography sx={{ color: 'text.secondary' }}>Headless CMS not yet populated for <code>{slug}</code>. Publish via <code>POST /cms/blog/publish</code> (n8n). Fallback excerpt shown in <Link to="/blog">Blog List</Link>.</Typography>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography>
          )}
          <Button component={Link} to="/blog" sx={{ mt: 2, textTransform: 'none', borderRadius: 2 }} variant="outlined">← Back to Blog</Button>
        </Paper>
      </Container>
    </Box>
  );
};
export default BlogPostPage;
