const express = require('express')
const request = require('request')
const cheerio = require('cheerio')
const moment = require('moment')
const MongoDB = require('../db/mongodb')

const convertCyrillic = require('cyrillic-to-latin')
const router = express.Router()
/* GET home page. */
router.get('/', function(req, res, next) {
  request.get('http://www.epsdistribucija.rs/Dan_0_Iskljucenja.htm', (error, response, body) => {
      const $ = cheerio.load(body)
      const info = []
      const rows = $('tr[bgcolor="#DDDDDD"]')
      for (let i = 1; i < rows.length; i++ ) {
          const municipality = convertCyrillic(rows[i].children[0].children[0].data)
          const time = convertCyrillic(rows[i].children[1].children[0].data)
          const streets = convertCyrillic(rows[i].children[2].children[0].data)
          info.push(...normalizeScrappedStreets(municipality, time, streets))
      }
      const db = MongoDB.getDB()
      db.collection('eps').insertMany(info).then((result) => {
          res.send(`<pre>${JSON.stringify(info)}</pre>`)
      })
      .catch((e) => { throw e })

  })
})

const normalizeScrappedStreets = (municipality, timeRange, streetsString) => {
   const streets = streetsString.split(", ")
    let normalizedStreets = []
    streets.forEach ((street) => {
        let streetsArray = street.split(": ")
        if(streetsArray[0].indexOf('Naselje') > -1) {
            streetsArray.shift()
        }
        if (streetsArray.length === 2) {
            let result = traverseStreetNumbers(streetsArray)
            normalizedStreets = [...normalizedStreets, ...result]
        }
    })
    const [ startTime, endTime ] = timeRange.split(" - ")
    return normalizedStreets.map((street) => {
        return {
            ...street,
            municipality: municipality,
            city: 'Belgrade',
            state: 'RS',
            startTime: startTime,
            endTime: endTime,
            date: moment().format('MM-DD-YYYY')
        }
    })

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
                    streetName: street.trim(),
                    streetNumber: i
                })
            }
        } else {
            result.push({
                streetName: street.trim(),
                streetNumber: streetNo.trim()
            })
        }
    })
    return result
}

module.exports = router
