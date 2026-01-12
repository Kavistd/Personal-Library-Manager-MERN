import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

function MyLibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingBookId, setUpdatingBookId] = useState(null);
  // Track form values for each book (status and review)
  const [bookForms, setBookForms] = useState({});
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth(); // Get user and logout from AuthContext

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchBooks();
  }, [navigate, isAuthenticated]);

  const fetchBooks = async () => {
    try {
      // api instance automatically attaches token via interceptor
      const response = await api.get('/books');
      const fetchedBooks = response.data;
      setBooks(fetchedBooks);
      setError(''); // Clear any previous errors
      
      // Initialize form values with current book data
      const initialForms = {};
      fetchedBooks.forEach(book => {
        initialForms[book._id] = {
          status: book.status || 'Want to Read',
          review: book.review || ''
        };
      });
      setBookForms(initialForms);
    } catch (err) {
      // 401 errors are handled by the axios interceptor
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to load books. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to remove this book from your library?')) {
      return;
    }

    try {
      // api instance automatically attaches token via interceptor
      await api.delete(`/books/${bookId}`);
      
      // Update UI instantly - remove from state
      setBooks(books.filter((book) => book._id !== bookId));
      
      // Also remove from form state
      setBookForms(prev => {
        const newForms = { ...prev };
        delete newForms[bookId];
        return newForms;
      });
    } catch (err) {
      alert('Failed to delete book. Please try again.');
    }
  };

  const handleStatusChange = (bookId, newStatus) => {
    // Update local form state only
    setBookForms(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        status: newStatus
      }
    }));
  };

  const handleReviewChange = (bookId, newReview) => {
    // Update local form state only
    setBookForms(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        review: newReview
      }
    }));
  };

  const handleUpdateBook = async (bookId) => {
    const formData = bookForms[bookId];
    if (!formData) return;

    setUpdatingBookId(bookId);

    try {
      // api instance automatically attaches token via interceptor
      const response = await api.put(`/books/${bookId}`, {
        status: formData.status,
        review: formData.review
      });
      
      // Update book in state with response data
      setBooks(
        books.map((book) =>
          book._id === bookId ? response.data.book : book
        )
      );
      
      // Update form state to match saved data
      setBookForms(prev => ({
        ...prev,
        [bookId]: {
          status: response.data.book.status,
          review: response.data.book.review || ''
        }
      }));
    } catch (err) {
      alert('Failed to update book. Please try again.');
    } finally {
      setUpdatingBookId(null);
    }
  };

  const handleLogout = () => {
    logout(); // Use AuthContext's logout function
  };

  if (loading) {
    return <LoadingSpinner message="Loading your library..." />;
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1>📖 My Library</h1>
          <p>Welcome back, {user?.username || 'User'}! Manage your book collection</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/search')} className="btn-primary">
            🔍 Search Books
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '0 2rem' }}>
        {error && (
          <div className="error-message" role="alert">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

      {books.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-icon">📚</p>
          <h3>No books saved yet</h3>
          <p>Your library is empty. Start adding books to build your collection!</p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            🔍 Start Adding Books
          </button>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              {book.thumbnail && (
                <img src={book.thumbnail} alt={book.title} className="book-thumbnail" />
              )}
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="book-authors">
                  {book.authors ? book.authors.join(', ') : 'Unknown Author'}
                </p>
                {book.description && (
                  <p className="book-description">
                    {book.description.substring(0, 150)}...
                  </p>
                )}
                <div className="book-status">
                  <label>Status:</label>
                  <select
                    value={bookForms[book._id]?.status || book.status || 'Want to Read'}
                    onChange={(e) => handleStatusChange(book._id, e.target.value)}
                    className="status-select"
                    disabled={updatingBookId === book._id}
                  >
                    <option value="Want to Read">Want to Read</option>
                    <option value="Reading">Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="book-review-input">
                  <label>Review:</label>
                  <textarea
                    value={bookForms[book._id]?.review || ''}
                    onChange={(e) => handleReviewChange(book._id, e.target.value)}
                    placeholder="Write your review here..."
                    className="review-textarea"
                    disabled={updatingBookId === book._id}
                    rows="4"
                  />
                </div>
                <div className="book-actions">
                  <button
                    onClick={() => handleUpdateBook(book._id)}
                    disabled={updatingBookId === book._id}
                    className="btn-update"
                  >
                    {updatingBookId === book._id ? '💾 Updating...' : '💾 Save/Update'}
                  </button>
                  {book.infoLink && (
                    <a
                      href={book.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="book-link"
                    >
                      View Details
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(book._id)}
                    className="btn-delete"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default MyLibraryPage;
