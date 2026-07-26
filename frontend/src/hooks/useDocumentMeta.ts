import { useEffect } from 'react';

interface MetaOptions {
  title: string;
  description?: string;
}

export function useDocumentMeta({ title, description }: MetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description]);
}
