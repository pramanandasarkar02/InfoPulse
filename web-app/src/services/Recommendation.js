import newsService from "./NewsService"

class Recommendation {
    constructor() {
        this.articles = []
        this.categories = []
    }

    setCategories(categories) {
        this.categories = categories
    }

    async recommendationByCategory() {
        // Fixed logic: should return early if categories exist and articles are already loaded
        // if (this.categories.length > 0 && this.articles.length > 0) {
        //     // console.log('Using cached articles', this.articles)
        //     const randomNews = []
        //     for (const article of this.articles) {
        //         const randomIndex = Math.floor(Math.random() * this.categories.length)
        //         randomNews.push(this.articles[randomIndex])
        //     }
        //     this.articles = randomNews
        //     return this.articles
        // }
        
        
        let categoryArticles = []
        // let noCategory = false
        
        // if (this.categories.length == 0) {
        //     noCategory = true
        //     this.categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
        // }
        const allArticleResponse = await newsService.getArticles()

        this.categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
        for (const category of this.categories) {
            for (const article of allArticleResponse.data.articles) {
                if (article.category == category) {
                    categoryArticles.push(article)
                }
            }
        }

        // console.log('categoryArticles', categoryArticles)

        
        // if (noCategory) {
        //     this.categories = []
        // }

        // Make randomized category articles
        const randomizeCategoryArticles = categoryArticles.map((categoryArticle, index) => {
            const randomIndex = Math.floor(Math.random() * categoryArticle.length)
            return categoryArticle[randomIndex]
        })
        // get random number of recommended articles from total half to full length of randomizeCategoryArticles
        const randomRecommendedArticles = allArticleResponse.data.articles.slice(Math.floor(Math.random() * randomizeCategoryArticles.length))
        this.articles = randomRecommendedArticles
        console.log('randomRecommendedArticles', randomRecommendedArticles)
        
        return randomRecommendedArticles
    }

    getCategories() {
        return this.categories
    }
}

// Fixed: use 'new' keyword to create instance
const recommendations = new Recommendation()

export default recommendations