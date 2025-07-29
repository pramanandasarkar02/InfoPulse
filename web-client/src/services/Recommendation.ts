// import { NewsArticle } from "../types";
// import { Article } from "../types/Article";

// export class RecommendationArticle {
//     static async getRecommendatedArticles(): Promise<Article[]> {
//         return [];
//     }
//     private static extractAuthor(content: string): string | null {
//     const authorPatterns = [
//       /By\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
//       /Reporter:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
//       /Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
//       /Author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
//       /\-\s*([A-Z][a-z]+\s+[A-Z][a-z]+)$/m,
//     ];

//     for (const pattern of authorPatterns) {
//       const match = content.match(pattern);
//       if (match) {
//         return match[1];
//       }
//     }

//     return null;
//   }

//     static async gettrendingArticle(): Promise<NewsArticle[]> {
//         const trendingEndpoint = "http://localhost:3005/articles/trending";
//         const response = await fetch(trendingEndpoint);
//         const data = await response.json();
//         const articles: Article[] = data.articles;
//         // console.log(articles);

//         // change the type of articles to NewsArticle
//         const newsArticles: NewsArticle[] = articles.map((article) => {
//             return {
//                 id: article.id,
//                 title: article.title,
//                 content: article.content,
//                 publishedAt: article.insertion_date ,
//                 imageUrl: article.images[0],
//                 keywords: article.keywords,
//                 topics: article.topics,
//                 createdAt: article.insertion_date,
//                 category: article.keywords,
//                 source: article.url,
//                 tags: article.keywords,
//                 summary: article.summerylarge,
//                 isFavorited: false,
//                 url: article.url,
//                 readTime: Math.random() * 10 + 5,
//                 author: this.extractAuthor(article.content) || 'News Reporter',
//             };
//         });

//         return newsArticles;
//     }
// }