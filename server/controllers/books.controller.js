const SavedBook = require('../models/SavedBook');

// Get all saved books for user
const getSavedBooks = async (req, res) => {
  try {
    const books = await SavedBook.find({ userId: req.user?.userId });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save a book
const saveBook = async (req, res) => {
  try {
    const { googleBookId, title, authors, thumbnail, description, infoLink } = req.body;

    if (!googleBookId || !title) {
      return res.status(400).json({ message: 'Please provide googleBookId and title' });
    }

    const existingBook = await SavedBook.findOne({ userId: req.user?.userId, googleBookId });
    if (existingBook) {
      return res.status(400).json({ message: 'Book already saved' });
    }

    const book = new SavedBook({
      userId: req.user?.userId,
      googleBookId,
      title,
      authors,
      description,
      thumbnail,
      infoLink,
    });

    await book.save();
    res.status(201).json({ message: 'Book saved successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update book (status, rating, notes)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review } = req.body;

    const book = await SavedBook.findOne({ _id: id, userId: req.user?.userId });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const allowed = ['Reading', 'Completed', 'Want to Read'];
    if (status) {
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      book.status = status;
    }
    if (review !== undefined) book.review = review;

    await book.save();
    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await SavedBook.findOneAndDelete({ _id: id, userId: req.user?.userId });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getSavedBooks, saveBook, updateBook, deleteBook };
