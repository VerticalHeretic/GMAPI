const cheerio = require('cheerio')
const fetch = require("isomorphic-fetch")

const {
    pool
} = require('../../API/model/db')


const {
    convertToPgDate
} = require('../utilities')

const metaUrls2 = [
    'https://www.metacritic.com/browse/games/release-date/coming-soon/pc/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ps5/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ps4/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/xbox-series-x/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/xboxone/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/switch/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ios/date',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/stadia/date'
]

async function scraper() {
    for await (url of metaUrls2) {
        const games = await getGames(url);
    }
}

async function getPagedUrls(urls) { 
    let pagedUrls = new Array()
    for await( url of urls){
        let pages = await getPages(url)
        console.log(pages)
    }
}
 
async function getPages(url) {
    const response = await fetch(url)
    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const text = await response.text()
    const $ = cheerio.load(text)
    let urls = new Array()

    let pagesCount = $('.last_page').find('.page_num').text()
    for( let page = 1; page <= pagesCount; page++){
        urls.push(`${url}/${page}`)
    }
    return urls
}

async function getGames(url) {
    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }

    const text = await response.text()
    const $ = cheerio.load(text)
    let games = new Array()
    
    
    $('.clamp-summary-wrap').each((i, el) => {
            const gameTitle = $(el).find('h3').first().text()
            const gameLink = $(el).find('a.title').first().attr('href')
            const gameDetails = $(el).find('.clamp-details')
            const gamePlatform = gameDetails.find('span').next('span').text().replace(/\s\s+/g, '')
            const gameRelease = gameDetails.find('span').last().text().replace(/\s\s+/g, '')
            const gameSummary = $(el).find('div.summary').first().text().replace(/\s\s+/g, '')
            const gameScoreDiv = $(el).find('div.clamp-userscore')
            const gameScore = gameScoreDiv.find('a').children().first().text()
            games.push({gameTitle, gameSummary, gamePlatform, gameScore, gameRelease,gameLink})
    })


    for await(game of games) {
       
        const gameDetails = await getGameDetails("https://metacritic.com" + game.gameLink).catch(error => alert(error.message))
        
        if (gameDetails[1].gameDeveloper != undefined || gameDetails[1].gameDeveloper != "") {
            game["gameDeveloper"] = gameDetails[1].gameDeveloper
        } else { 
            game["gameDeveloper"] = "Unknown"
        }

        if (gameDetails[1].gameGenre != undefined || gameDetails[1].gameGenre != "") { 
            game["gameGenre"] = gameDetails[1].gameGenre 
        } else {
            game["gameGenre"] = "Unknown"
        }   

        pool.query('INSERT INTO games (title, description, developer, release_date, platform, score, genres) VALUES ($1,$2,$3,$4,$5,$6,[$7]) ON CONFLICT ON CONSTRAINT games_title_key DO NOTHING;', [game.gameTitle,game.gameSummary, game.gameDeveloper, game.gameGenre, convertToPgDate(game.gameRelease), game.gamePlatform, game.gameScore], (error, results) => {
            if (error) {
                throw new Error(`Error on inserting to database occured ❌: ${error}`);
            }
        });
        
        console.log(game)
        
    }


    return games
}

async function getGameDetails(url) { 
    await setTimeout[Object.getOwnPropertySymbols(setTimeout)[0]](3000) 
    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }

    const text = await response.text()
    const $ = cheerio.load(text)
    let details = new Array()
    $('div.side_details').each((i, el) => {
        const gameDeveloperLi = $(el).find('li.developer')
        const gameDeveloper = gameDeveloperLi.find('span.data').text().replace(/\s\s+/g, '')
        const gameGenreLi = $(el).find('li.product_genre')
        const gameGenre = gameGenreLi.find('span.data').first().text()
        details.push({gameDeveloper, gameGenre})
    })
    return details
}

module.exports = {
    scraper
}