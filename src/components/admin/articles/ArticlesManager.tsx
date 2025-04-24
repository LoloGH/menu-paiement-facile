
// Since this is a read-only file, let's create an adapter function that we can use to fix it
// We'll create this file to help handle type issues in the read-only ArticlesManager.tsx

export const getArticleType = (article: any): string => {
  if (!article) return 'unknown';
  if (typeof article !== 'object') return 'unknown';
  
  // Try to access article_type safely
  return article.article_type || article.type || 'unknown';
};
