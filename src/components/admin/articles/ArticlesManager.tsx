
// Since this is a read-only file, let's create an adapter function that we can use to fix it
// We'll create this file to help handle type issues in the read-only ArticlesManager.tsx

export const getArticleType = (article: any): string => {
  if (!article) return 'unknown';
  if (typeof article !== 'object') return 'unknown';
  
  // Try to access article_type safely
  return article.article_type || article.type || 'unknown';
};

// Re-export the ArticlesManager component here so that it can be imported elsewhere
export { ArticlesManager } from "@/integrations/supabase/client"; 
// The actual component is in a read-only file and will be used by the import

// Export a dummy component to satisfy imports
export const ArticlesManagerAdapter = ({ readOnly = false }: { readOnly?: boolean }) => {
  return null; // This won't actually be used since the real component is in a read-only file
};
