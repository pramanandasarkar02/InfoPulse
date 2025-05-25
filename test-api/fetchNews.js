// Use node-fetch v2 for CommonJS compatibility
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

async function extractNewsContent(url) {
  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Log response for debugging
    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Get the HTML content
    const html = await response.text();
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Common selectors for article content, prioritized for AP News
    const articleSelectors = [
      'div.Article', // Common for AP News
      'div[itemprop="articleBody"]',
      'article',
      '.article-body',
      '.entry-content',
      '.post-content',
      '.content'
    ];
    
    let content = '';
    
    // Try each selector until content is found
    for (const selector of articleSelectors) {
      const article = $(selector).text().trim();
      if (article) {
        content = article;
        break;
      }
    }
    
    // Fallback: extract from paragraph tags, excluding noise
    if (!content) {
      content = $('p')
        .not('.caption, .advertisement, .meta, .footer, .sidebar')
        .map((i, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 20)
        .join('\n\n');
    }
    
    // Clean up excessive whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    if (!content) {
      return 'No article content found. The website may use a non-standard structure or block scraping.';
    }
    
    // Save to file
    try {
      fs.writeFileSync('article.txt', content);
      console.log('Content saved to article.txt');
    } catch (fileError) {
      console.error('Error saving to file:', fileError.message);
    }
    
    return content;
  } catch (error) {
    console.error('Error:', error.message);
    return 'Failed to fetch or parse the content. Possible issues: CORS, paywall, or invalid URL.';
  }
}

// Example usage
const newsUrl = 'https://apnews.com/article/japan-rice-a01060f60874ec7fa8a24edf7917d779';
extractNewsContent(newsUrl).then(content => {
  console.log('Extracted Content:', content);
});