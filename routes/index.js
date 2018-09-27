const express = require('express')
const request = require('request')
const cheerio = require('cheerio')
const convertCyrillic = require('cyrillic-to-latin')
const router = express.Router()
/* GET home page. */
router.get('/', function(req, res, next) {
  request.get('http://www.epsdistribucija.rs/Dan_0_Iskljucenja.htm', (error, response, body) => {
      const $ = cheerio.load(body)
      const info = []
      const rows = $('tr[bgcolor="#DDDDDD"]')
      for (let i = 1; i < rows.length; i++ ) {
          info.push({
              municipality: rows[i].children[0].children[0].data ? convertCyrillic(rows[i].children[0].children[0].data) : '',
              vreme: rows[i].children[1].children[0].data,
              streets: normalizeScrappedStreets(convertCyrillic(rows[i].children[2].children[0].data))
          })
      }
      res.send(body)
  })
})

const normalizeScrappedStreets = (streetsString) => {
    const streets = streetsString.split(", ")
    let normalizedStreets = []
    streets.forEach ((street) => {
        let streetsArray = street.split(": ")
        if(streetsArray[0].indexOf('Naselje') > -1) {
            streetsArray.shift()
        }
        let result = traverseStreetNumbers(streetsArray)
        normalizedStreets = [...normalizedStreets, ...result]
    })
    return normalizedStreets
}

const traverseStreetNumbers = ([street, numbers]) => {
    const result = []
    let splitNumbers = numbers.split(',')
    splitNumbers = splitNumbers.filter(splitNumber => !!splitNumber)
    splitNumbers.forEach((streetNo) => {
        const lastLetter = streetNo[streetNo.length - 1]
        if (isNaN(lastLetter)) {
            streetNo = streetNo.substr(0, streetNo.length - 1)
        }

        if (streetNo.indexOf('-') > -1) {
            const streetRange = streetNo.split('-')
            const [ min, max ] = streetRange
            for (let i = min; i <= max; i++) {
                result.push({
                    street: street.trim(),
                    number: i
                })
            }
        } else {
            result.push({
                street: street.trim(),
                number: streetNo.trim()
            })
        }
    })
    return result
}

module.exports = router
