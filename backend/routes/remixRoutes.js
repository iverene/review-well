const express = require('express')
const router = express.Router()
const { cloneReviewer } = require('../controllers/remixController')

router.post('/:id/clone', cloneReviewer)

module.exports = router
