const fs = require('fs')

const API_KEY = "pub_83889cb7d5996d47652420f8c27e739fed039"
const BASE_URL = "https://newsdata.io/api/1/"

// create file and save news there
const saveNewToFile = (news) => {
    fs.writeFileSync('news.json', JSON.stringify(news))
    console.log("news saved to news.json")
}


const fetchNews = async () =>{
    const url = `${BASE_URL}sources?country=bd&apikey=${API_KEY}`
    const response = await fetch(url)
    const news = await response.json()
    saveNewToFile(news)

}

fetchNews()