import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Paper, Chip, Button, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { API_BASE_URL } from '../../config';

type Post = { slug:string; title:string; excerpt:string; date:string; badge:string; author:string; };

const FALLBACK: Post[] = [
  { slug: 'ai-fmea-7-step-deep-dive', title: 'AI FMEA 7-Step Deep Dive — From Planning to Documentation', excerpt: 'How FMEApex enforces gating and AP lookups without AI slop.', date: '2026-07-20', badge: 'Product', author: 'FMEApex Team' },
  { slug: 'pfd-pfmea-orphan-detection', title: 'PFD ↔ PFMEA Orphan Detection at Scale', excerpt: 'Detect missing links before audit — with one query.', date: '2026-07-18', badge: 'Engineering', author: 'FMEApex Team' },
  { slug: 'control-plan-enterprise-sync', title: 'Control Plan Sync for Automotive', excerpt: 'Serializable control propagation for ZF, Bosch, Magna.', date: '2026-07-15', badge: 'Automotive', author: 'FMEApex Team' },
];

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(FALLBACK);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled=false;
    (async()=>{
      try{
        const r=await fetch(`${API_BASE_URL}/cms/blog/posts`);
        if(r.ok){ const j=await r.json(); const arr=j.data||j; if(Array.isArray(arr) && arr.length) { if(!cancelled) setPosts(arr); }}
      }catch{}
    })();
    return ()=>{cancelled=true;};
  }, []);

  const filtered = posts.filter(p=>!q|| p.title.toLowerCase().includes(q.toLowerCase()) || p.excerpt.toLowerCase().includes(q.toLowerCase()));

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <SEO title="Blog — FMEApex | Quality, AI, Automotive" description="FMEApex blog — headless CMS (n8n automate POST /cms/blog/publish), BlogPosting JSON-LD, sitemap indexed." canonical="/blog" jsonLd={{ '@context':'https://schema.org','@type':'Blog', name:'FMEApex Blog', url:'https://fmeapex.online/blog' }} />
      <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Blog</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>Headless CMS `POST /cms/blog/publish` → `n8n` automation (Q3 B). Fallback 3 posts seed until first publish.</Typography>
          <TextField placeholder="Search posts…" size="small" value={q} onChange={e=>setQ(e.target.value)} sx={{ mt: 2, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 }, minWidth: 320 }} />
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {filtered.map(p => (
            <Grid key={p.slug} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} component={Link} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', display: 'block', height: '100%', '&:hover': { borderColor: '#0D9488' } }}>
                <Chip label={p.badge} size="small" sx={{ bgcolor: 'rgba(13,148,136,0.1)', color: '#0D9488' }} />
                <Typography sx={{ fontWeight: 700, mt: 1 }}>{p.title}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>{p.excerpt}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 1 }}>{p.date} · {p.author}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4, display: 'flex', gap: 1 }}>
          <Button component={Link} to="/learn" variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Learn Hub</Button>
          <Button component={Link} to="/product" variant="contained" sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' } }}>Product</Button>
        </Box>
      </Container>
    </Box>
  );
};
export default BlogListPage;
