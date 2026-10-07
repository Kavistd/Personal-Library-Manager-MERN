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
  const { user, isAuthenticated } = useAuth();

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

  if (loading) {
    return <LoadingSpinner message="Loading your library…" />;
  }

  const countByStatus = (status) => books.filter((book) => book.status === status).length;

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1>My Library</h1>
          <p>Welcome back, {user?.username || 'reader'}. Here's everything on your shelf.</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/search')} className="btn-primary">
            + Add books
          </button>
        </div>
      </div>

      <div className="library-content">
        {error && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

      {books.length > 0 && (
        <div className="library-stats">
          <span className="library-stat"><strong>{books.length}</strong> books</span>
          <span className="library-stat"><strong>{countByStatus('Reading')}</strong> reading</span>
          <span className="library-stat"><strong>{countByStatus('Completed')}</strong> completed</span>
          <span className="library-stat"><strong>{countByStatus('Want to Read')}</strong> want to read</span>
        </div>
      )}

      {books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6.5A2.5 2.5 0 0 0 4 20.5 2.5 2.5 0 0 0 6.5 23H19v-5" />
            </svg>
          </span>
          <h3>Your shelf is empty</h3>
          <p>Search for books you love and save them here to track your reading.</p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            Find books
          </button>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <div className="book-cover">
                <span className="book-cover-placeholder" aria-hidden="true">{book.title?.charAt(0)}</span>
                {book.thumbnail && (
                  <img
                    src={book.thumbnail.replace('http://', 'https://')}
                    alt={book.title}
                    className="book-thumbnail"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('cover-missing');
                    }}
                  />
                )}
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="book-authors">
                  {book.authors ? book.authors.join(', ') : 'Unknown Author'}
                </p>
                {book.description && (
                  <p className="book-description">{book.description}</p>
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
                    {updatingBookId === book._id ? 'Saving…' : 'Save changes'}
                  </button>
                  {book.infoLink && (
                    <a
                      href={book.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="book-link"
                    >
                      Details
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(book._id)}
                    className="btn-delete"
                  >
                    Remove
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
