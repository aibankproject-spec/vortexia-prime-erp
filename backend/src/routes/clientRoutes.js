const express = require('express');
const router = express.Router();
const c = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(c.getClients)
  .post(authorize('super_admin', 'admin', 'sales_manager'), c.createClient);

router.get('/stats', c.getClientStats);
router.post('/bulk-import', authorize('super_admin', 'admin'), upload.single('file'), c.bulkImport);

router.route('/:id')
  .get(c.getClient)
  .put(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), c.updateClient)
  .delete(authorize('super_admin', 'admin'), c.deleteClient);

router.put('/:id/status', authorize('super_admin', 'admin', 'sales_manager'), c.updateClientStatus);
router.put('/:id/credit-limit', authorize('super_admin', 'admin', 'finance'), c.updateCreditLimit);

// Contacts
router.route('/:id/contacts')
  .get(c.getContacts)
  .post(c.addContact);

router.route('/:id/contacts/:contactId')
  .put(c.updateContact)
  .delete(c.deleteContact);

// Documents
router.post('/:id/documents', upload.single('file'), c.addDocument);

module.exports = router;
