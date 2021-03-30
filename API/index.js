// Dependencies
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')   
const csrf = require('csurf')
const cron = require('../Scraping/cron')

// Routes dependecies
const scraperController = require('./controller/scraperController')
const gamesRoutes = require('./routes/games')

const PORT = process.env.PORT || 3000

// definining the app
const app = express()

// adding Helmet to enhance your API's security 
app.use(helmet());

// Logging http requests 
app.use(morgan('combined'));
const csrfProtection = csrf({ cookie: true })

app.use(
    express.json(),
    express.urlencoded({
        extended: false,
    }),
    cookieParser()
)

app.get('/', (request, response) => {
    response.json({ message: 'GMAPI - Gaming Premiers API'})
})

app.use('/games', gamesRoutes)

app.post('/games/scrape', csrf({ cookie: true, ignoreMethods: ['POST'] }), scraperController.startScraperManually)

app.listen(PORT, () => {
    console.log(`App running on port ${PORT} ⛴`)
})




