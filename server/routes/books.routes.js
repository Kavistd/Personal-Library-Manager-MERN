const express = require('express');
const router = express.Router();
const {
  getSavedBooks,
  saveBook,
  updateBook,
  deleteBook,
} = require('../controllers/books.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.get('/', auth, getSavedBooks);
router.post('/', auth, saveBook);
router.put('/:id', auth, updateBook);
router.delete('/:id', auth, deleteBook);

module.exports = router;
