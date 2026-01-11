import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function MyLibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setBooks(response.data);
    } catch (err) {
      // 401 errors are handled by the axios interceptor
      setError('Failed to load books. Please try again.');
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
      // Remove book from state
      setBooks(books.filter((book) => book._id !== bookId));
    } catch (err) {
      alert('Failed to delete book. Please try again.');
    }
  };

  const handleStatusChange = async (bookId, newStatus) => {
    try {
      // api instance automatically attaches token via interceptor
      await api.put(`/books/${bookId}`, { status: newStatus });
      // Update book status in state
      setBooks(
        books.map((book) =>
          book._id === bookId ? { ...book, status: newStatus } : book
        )
      );
    } catch (err) {
      alert('Failed to update book status. Please try again.');
    }
  };

  const handleLogout = () => {
    logout(); // Use AuthContext's logout function
  };

  if (loading) {
    return <div className="loading">Loading your library...</div>;
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1>My Library</h1>
          <p>Welcome, {user?.username || 'User'}!</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/search')} className="btn-primary">
            Search Books
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {books.length === 0 ? (
        <div className="empty-library">
          <p>Your library is empty.</p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            Start Adding Books
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
                    value={book.status || 'Want to Read'}
                    onChange={(e) => handleStatusChange(book._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="Want to Read">Want to Read</option>
                    <option value="Reading">Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {book.review && (
                  <div className="book-review">
                    <strong>Review:</strong>
                    <p>{book.review}</p>
                  </div>
                )}
                <div className="book-actions">
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
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyLibraryPage;
