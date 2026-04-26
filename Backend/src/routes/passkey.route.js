const express = require('express');
const { requireSession } = require('../middleware/sessionAuth');
const { ipValidation, requestSizeValidation } = require('../middleware/validation');
const { securityLogging } = require('../middleware/security');
const passkeyController = require('../controllers/passkey.controller');

const router = express.Router();

router.use(ipValidation);
router.use(requestSizeValidation);
router.use(securityLogging);
router.use(requireSession); // all passkey routes require a valid session

router.get('/',                passkeyController.list);
router.post('/',               passkeyController.upsert);
router.delete('/:clientId',    passkeyController.remove);

module.exports = router;
