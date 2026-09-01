const express = require('express')
const router = express.Router()
const { extractFromUpload } = require('../controllers/aiController')

router.post('/extract', extractFromUpload)

module.exports = router
