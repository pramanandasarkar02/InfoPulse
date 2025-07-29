import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import pkg from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import rateLimit from 'express-rate-limit';

const { Pool } = pkg;
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;
const newsFetchingServiceUrl = 'http://localhost:3001';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API2);
let currentAPI = genAI;

// PostgreSQL connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'info-pulse-db',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: process.env.POSTGRES_PORT || 5432,
});

// Rate limiting for API requests
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // limit each IP to 15 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter);

// Rate limiting for Gemini API calls
class GeminiRateLimiter {
    constructor() {
        this.requests = [];
        this.maxRequestsPerMinute = 15; // Gemini free tier limit
        this.switchDelay = 60000; // 1 minute
    }

    async waitForAvailability() {
        const now = Date.now();
        
        // Remove requests older than 1 minute
        this.requests = this.requests.filter(time => now - time < 60000);
        
        if (this.requests.length >= this.maxRequestsPerMinute) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 60000 - (now - oldestRequest) + 1000; // Add 1 second buffer
            
            console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Switch to alternate API key
            currentAPI = currentAPI === genAI ? genAI2 : genAI;
            console.log('Switched to alternate API key');
            
            return this.waitForAvailability();
        }
        
        this.requests.push(now);
    }
}

const rateLimiter = new GeminiRateLimiter();

// Database initialization
const initDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                original_id VARCHAR(255) UNIQUE,
                title TEXT NOT NULL,
                normalized_title TEXT NOT NULL,
                category VARCHAR(255),
                tags TEXT[],
                content TEXT,
                summary TEXT,
                images TEXT[],
                reading_time INTEGER,
                author VARCHAR(255),
                publication VARCHAR(255),
                url TEXT UNIQUE NOT NULL,
                insertion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processing_status VARCHAR(50) DEFAULT 'pending'
            )
        `);
        
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_normalized_title ON articles(normalized_title);
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author);
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_publication ON articles(publication);
        `);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Utility functions
const fetchHtml = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching HTML:', error.message);
        return null;
    }
};

const fetchArticles = async () => {
    try {
        const response = await axios.get(`${newsFetchingServiceUrl}/articles`);
        // console.log(response.data);
        return response.data.articles;
    } catch (error) {
        console.error('Error fetching articles:', error);
        return null;
    }
};

const getCategories = async () => {
    try {
        const response = await axios.get(`${newsFetchingServiceUrl}/categories`);
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return null;
    }
};

// Extract clean text content from HTML
const extractTextFromHtml = (html) => {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();
    
    // Try to find main content area
    let content = $('article').text() || 
                  $('.content').text() || 
                  $('.post-content').text() || 
                  $('.entry-content').text() || 
                  $('main').text() || 
                  $('body').text();
    
    // Clean up the text
    content = content.replace(/\s+/g, ' ').trim();
    
    return content.substring(0, 8000); // Limit content length for API
};

// Extract images from HTML
const extractImagesFromHtml = (html, baseUrl) => {
    const $ = cheerio.load(html);
    const images = [];
    
    $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src) {
            try {
                const imageUrl = new URL(src, baseUrl).href;
                if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    images.push(imageUrl);
                }
            } catch (e) {
                // Invalid URL, skip
            }
        }
    });
    
    return images.slice(0, 5); // Limit to 5 images
};

// Process article with Gemini AI
const processArticleWithGemini = async (article, htmlContent) => {
    try {
        await rateLimiter.waitForAvailability();
        
        const model = currentAPI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const textContent = extractTextFromHtml(htmlContent);
        const images = extractImagesFromHtml(htmlContent, article.url);
        
        const prompt = `
        Analyze the following article and extract the requested information in JSON format:
        
        Title: ${article.title}
        URL: ${article.url}
        Content: ${textContent}
        
        Please provide the following information in valid JSON format:
        {
            "tags": ["tag1", "tag2", "tag3"], // Extract 3-5 relevant tags
            "summary": "Brief summary in 2-3 sentences",
            "author": "Author name if found",
            "publication": "Publication name if found",
            "readingTime": 5, // Estimated reading time in minutes
            "processedContent": "Clean, well-formatted article content"
        }
        
        Rules:
        - Extract only factual information
        - If author or publication not found, use null
        - Reading time should be realistic (200-250 words per minute)
        - Tags should be lowercase and relevant(3-5)
        - Summary should capture main points
        - Content should be clean and readable and have paragraphs and bold /italic formatting, size 600- 1000 words
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const extractedData = JSON.parse(jsonMatch[0]);
            
            return {
                tags: extractedData.tags || [],
                summary: extractedData.summary || '',
                author: extractedData.author || null,
                publication: extractedData.publication || null,
                readingTime: extractedData.readingTime || 5,
                content: extractedData.processedContent || textContent.substring(0, 2000),
                images: images
            };
        } else {
            throw new Error('Could not parse JSON from Gemini response');
        }
        
    } catch (error) {
        console.error('Error processing with Gemini:', error.message);
        
        // Fallback processing
        const textContent = extractTextFromHtml(htmlContent);
        const images = extractImagesFromHtml(htmlContent, article.url);
        const wordCount = textContent.split(' ').length;
        
        return {
            tags: [],
            summary: textContent.substring(0, 200) + '...',
            author: null,
            publication: null,
            readingTime: Math.ceil(wordCount / 225),
            content: textContent.substring(0, 2000),
            images: images
        };
    }
};

// Utility function to normalize title for duplicate detection
const normalizeTitle = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '') // Remove common words
        .replace(/\s+/g, '') // Remove all spaces for comparison
        .slice(0, 100); // Limit length
};

// Check if article with similar title already exists
const checkDuplicateTitle = async (title) => {
    try {
        const normalizedTitle = normalizeTitle(title);
        const result = await pool.query(
            'SELECT id, title, url FROM articles WHERE normalized_title = $1 LIMIT 1',
            [normalizedTitle]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error checking duplicate title:', error);
        return null;
    }
};

// Save article to database
const saveArticleToDatabase = async (articleData) => {
    try {
        // Check for duplicate title first
        const existingArticle = await checkDuplicateTitle(articleData.title);
        if (existingArticle) {
            console.log(`Duplicate title detected: "${articleData.title}" (existing: "${existingArticle.title}")`);
            return {
                ...existingArticle,
                isDuplicate: true,
                duplicateReason: 'Similar title already exists'
            };
        }

        const normalizedTitle = normalizeTitle(articleData.title);

        const query = `
            INSERT INTO articles (
                original_id, title, normalized_title, category, tags, content, summary, 
                images, reading_time, author, publication, url, 
                insertion_date, processing_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (url) 
            DO UPDATE SET 
                tags = EXCLUDED.tags,
                content = EXCLUDED.content,
                summary = EXCLUDED.summary,
                images = EXCLUDED.images,
                reading_time = EXCLUDED.reading_time,
                author = EXCLUDED.author,
                publication = EXCLUDED.publication,
                processed_date = CURRENT_TIMESTAMP,
                processing_status = EXCLUDED.processing_status
            RETURNING *
        `;

        const values = [
            articleData.id,
            articleData.title,
            normalizedTitle,
            articleData.category,
            articleData.tags,
            articleData.content,
            articleData.summary,
            articleData.images,
            articleData.readingTime,
            articleData.author,
            articleData.publication,
            articleData.url,
            articleData.insertionDate,
            'completed'
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            // This case shouldn't happen with the current query, but keep it for robustness
            const existing = await pool.query(
                'SELECT * FROM articles WHERE url = $1 LIMIT 1',
                [articleData.url]
            );

            return {
                ...existing.rows[0],
                isDuplicate: true,
                duplicateReason: 'URL conflict'
            };
        }

        return { ...result.rows[0], isDuplicate: false };
    } catch (error) {
        console.error('Error saving article to database:', error);
        throw error;
    }
};

// Main article preparation function
const prepareArticle = async (article) => {
    try {
        console.log(`Processing article: ${article.title}`);
        
        // Check for duplicate title before processing
        const duplicateCheck = await checkDuplicateTitle(article.title);
        if (duplicateCheck) {
            console.log(`Skipping duplicate article: "${article.title}" (similar to: "${duplicateCheck.title}")`);
            return {
                ...duplicateCheck,
                isDuplicate: true,
                duplicateReason: 'Similar title already exists',
                skipped: true
            };
        }
        
        const html = await fetchHtml(article.url);
        if (!html) {
            throw new Error('Failed to fetch HTML content');
        }
        
        const processedData = await processArticleWithGemini(article, html);
        
        const preparedArticle = {
            id: article.id,
            title: article.title,
            category: article.category,
            tags: processedData.tags,
            content: processedData.content,
            summary: processedData.summary,
            images: processedData.images,
            readingTime: processedData.readingTime,
            author: processedData.author,
            publication: processedData.publication,
            url: article.url,
            insertionDate: article.insertionDate || new Date().toISOString()
        };
        
        // Save to database
        const savedArticle = await saveArticleToDatabase(preparedArticle);
        
        if (savedArticle.isDuplicate) {
            console.log(`Article skipped due to duplicate: ${article.title}`);
        } else {
            console.log(`Article processed and saved: ${article.title}`);
        }
        
        return savedArticle;
        
    } catch (error) {
        console.error(`Error preparing article ${article.title}:`, error.message);
        
        // Save with error status
        try {
            await pool.query(
                `INSERT INTO articles (original_id, title, normalized_title, url, processing_status) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (url) DO NOTHING ON CONFLICT (normalized_title) DO NOTHING`,
                [article.id, article.title, normalizeTitle(article.title), article.url, 'failed']
            );
        } catch (dbError) {
            console.error('Error saving failed article to database:', dbError);
        }
        
        throw error;
    }
};

// API Routes

// Process a single article
app.post('/api/process-article', async (req, res) => {
    try {
        const article = req.body;
        const processedArticle = await prepareArticle(article);
        res.json(processedArticle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process all articles from news service
app.post('/api/process-all-articles', async (req, res) => {
    try {
        const articles = await fetchArticles();
        if (!articles) {
            return res.status(500).json({ error: 'Failed to fetch articles' });
        }
        
        const results = {
            processed: 0,
            failed: 0,
            duplicates: 0,
            skipped: 0,
            total: articles.length,
            errors: [],
            duplicateArticles: []
        };
        
        // every min ready 10 articles prepare request one article prepareArticle then wait 10 seconds
        const delayBetweenArticles = 1000; // 5 seconds in milliseconds
        // res.json({ message: 'Processing started', newArticles: articles.length });
        for (const article of articles) {
            // send response article processing
            // res.json({ article, results });
            try {
                const result = await prepareArticle(article);
                if (result.isDuplicate) {
                    results.duplicates++;
                    results.duplicateArticles.push({
                        title: article.title,
                        reason: result.duplicateReason
                    });
                    if (result.skipped) {
                        results.skipped++;
                    }
                } else if (result.processing_status === 'failed') {
                    results.failed++;
                    results.errors.push(`Failed to process article: ${article.title}`);
                } else {
                    results.processed++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error processing article ${article.title}: ${error.message}`);
            }
            // await delay(delayBetweenArticles); // Wait 5 seconds before the next article
        }

        console.log(`Processing completed: ${results.processed} processed, ${results.duplicates} duplicates, ${results.failed} failed`);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all articles
app.get('/api/articles', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, author, publication } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM articles WHERE processing_status = $1';
        let params = ['completed'];
        let paramIndex = 2;
        
        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        if (author) {
            query += ` AND author = $${paramIndex}`;
            params.push(author);
            paramIndex++;
        }
        
        if (publication) {
            query += ` AND publication = $${paramIndex}`;
            params.push(publication);
            paramIndex++;
        }
        
        query += ` ORDER BY processed_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM articles WHERE processing_status = $1';
        let countParams = ['completed'];
        let countParamIndex = 2;
        
        if (category) {
            countQuery += ` AND category = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }
        
        if (author) {
            countQuery += ` AND author = $${countParamIndex}`;
            countParams.push(author);
            countParamIndex++;
        }
        
        if (publication) {
            countQuery += ` AND publication = $${countParamIndex}`;
            countParams.push(publication);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);
        
        res.json({
            articles: result.rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_articles: total,
                per_page: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get articles by category
app.get('/api/articles/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            'SELECT * FROM articles WHERE category = $1 AND processing_status = $2 ORDER BY processed_date DESC LIMIT $3 OFFSET $4',
            [category, 'completed', parseInt(limit), offset]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get articles by tag
app.get('/api/articles/tag/:tag', async (req, res) => {
    try {
        const { tag } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            'SELECT * FROM articles WHERE $1 = ANY(tags) AND processing_status = $2 ORDER BY processed_date DESC LIMIT $3 OFFSET $4',
            [tag, 'completed', parseInt(limit), offset]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get articles by author
app.get('/api/articles/author/:author', async (req, res) => {
    try {
        const { author } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            'SELECT * FROM articles WHERE author = $1 AND processing_status = $2 ORDER BY processed_date DESC LIMIT $3 OFFSET $4',
            [author, 'completed', parseInt(limit), offset]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get articles by publication
app.get('/api/articles/publication/:publication', async (req, res) => {
    try {
        const { publication } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            'SELECT * FROM articles WHERE publication = $1 AND processing_status = $2 ORDER BY processed_date DESC LIMIT $3 OFFSET $4',
            [publication, 'completed', parseInt(limit), offset]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get article by ID
app.get('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM articles WHERE id = $1 AND processing_status = $2',
            [id, 'completed']
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/articles/title/:title', async (req, res) => {
    try {
        const { title } = req.params;
        

        const result = await pool.query(
            'SELECT * FROM articles WHERE title = $1 AND processing_status = $2',
            [title, 'completed']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get atricle by url
app.get('/api/articles/url', async (req, res) => {
    const { url } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM articles WHERE url = $1 AND processing_status = $2',
            [url, 'completed']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// Get processing statistics
app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                processing_status,
                COUNT(*) as count,
                MAX(processed_date) as last_processed
            FROM articles 
            GROUP BY processing_status
        `);
        
        const categoryStats = await pool.query(`
            SELECT 
                category,
                COUNT(*) as count
            FROM articles 
            WHERE processing_status = 'completed'
            GROUP BY category
            ORDER BY count DESC
        `);
        
        const duplicateStats = await pool.query(`
            SELECT 
                COUNT(*) as total_articles,
                COUNT(DISTINCT normalized_title) as unique_titles,
                COUNT(*) - COUNT(DISTINCT normalized_title) as potential_duplicates
            FROM articles
        `);
        
        const recentDuplicates = await pool.query(`
            SELECT 
                normalized_title,
                COUNT(*) as count,
                array_agg(title ORDER BY processed_date DESC) as titles,
                array_agg(url ORDER BY processed_date DESC) as urls
            FROM articles 
            GROUP BY normalized_title 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 10
        `);
        
        res.json({
            processing_stats: result.rows,
            category_stats: categoryStats.rows,
            duplicate_stats: duplicateStats.rows[0],
            recent_duplicates: recentDuplicates.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check for duplicate titles
app.post('/api/check-duplicate', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const duplicate = await checkDuplicateTitle(title);
        res.json({
            isDuplicate: !!duplicate,
            existing: duplicate,
            normalizedTitle: normalizeTitle(title)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all duplicate articles
app.get('/api/duplicates', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const duplicates = await pool.query(`
            SELECT 
                normalized_title,
                COUNT(*) as count,
                array_agg(
                    json_build_object(
                        'id', id,
                        'title', title,
                        'url', url,
                        'category', category,
                        'author', author,
                        'publication', publication,
                        'processed_date', processed_date
                    ) ORDER BY processed_date DESC
                ) as articles
            FROM articles 
            GROUP BY normalized_title 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT $1 OFFSET $2
        `, [parseInt(limit), offset]);
        
        const totalCount = await pool.query(`
            SELECT COUNT(*) FROM (
                SELECT normalized_title
                FROM articles 
                GROUP BY normalized_title 
                HAVING COUNT(*) > 1
            ) as duplicate_groups
        `);
        
        res.json({
            duplicates: duplicates.rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalCount.rows[0].count / limit),
                total_duplicate_groups: parseInt(totalCount.rows[0].count),
                per_page: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove duplicate articles (keep the most recent one)
app.delete('/api/duplicates/cleanup', async (req, res) => {
    try {
        const { dryRun = true } = req.query;
        
        const duplicateGroups = await pool.query(`
            SELECT 
                normalized_title,
                array_agg(id ORDER BY processed_date DESC) as ids,
                array_agg(title ORDER BY processed_date DESC) as titles
            FROM articles 
            GROUP BY normalized_title 
            HAVING COUNT(*) > 1
        `);
        
        let removedCount = 0;
        const removedArticles = [];
        
        if (dryRun === 'false') {
            for (const group of duplicateGroups.rows) {
                const idsToRemove = group.ids.slice(1); // Keep the first (most recent), remove others
                
                if (idsToRemove.length > 0) {
                    const deleteResult = await pool.query(
                        'DELETE FROM articles WHERE id = ANY($1) RETURNING id, title',
                        [idsToRemove]
                    );
                    
                    removedCount += deleteResult.rows.length;
                    removedArticles.push(...deleteResult.rows);
                }
            }
        }
        
        res.json({
            dryRun: dryRun !== 'false',
            duplicateGroups: duplicateGroups.rows.length,
            totalDuplicates: duplicateGroups.rows.reduce((sum, group) => sum + group.ids.length - 1, 0),
            removedCount,
            removedArticles: dryRun === 'false' ? removedArticles : 'Set dryRun=false to actually remove duplicates'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        
        app.listen(port, () => {
            console.log(`Article processing service running on port ${port}`);
            console.log('Available endpoints:');
            console.log('- POST /api/process-article - Process a single article');
            console.log('- POST /api/process-all-articles - Process all articles from news service');
            console.log('- GET /api/articles - Get all articles with pagination');
            console.log('- GET /api/articles/category/:category - Get articles by category');
            console.log('- GET /api/articles/tag/:tag - Get articles by tag');
            console.log('- GET /api/articles/author/:author - Get articles by author');
            console.log('- GET /api/articles/publication/:publication - Get articles by publication');
            console.log('- GET /api/articles/:id - Get article by ID');
            console.log('- GET /api/stats - Get processing statistics');
            console.log('- GET /health - Health check');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

startServer();