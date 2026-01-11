import React, { useState } from 'react';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Google Books API search
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`
      );
      const data = await response.json();

      if (data.items) {
        setBooks(data.items);
      } else {
        setBooks([]);
      }
    } catch (err) {
      setError('Failed to search books. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <h1>Search Books</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books..."
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="books-grid">
        {books.map((book) => {
          const volumeInfo = book.volumeInfo || {};
          const thumbnail = volumeInfo.imageLinks?.thumbnail || '';
          
          return (
            <div key={book.id} className="book-card">
              {thumbnail && (
                <img src={thumbnail} alt={volumeInfo.title} className="book-thumbnail" />
              )}
              <div className="book-info">
                <h3>{volumeInfo.title || 'No Title'}</h3>
                <p className="book-authors">
                  {volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}
                </p>
                {volumeInfo.description && (
                  <p className="book-description">
                    {volumeInfo.description.substring(0, 150)}...
                  </p>
                )}
                <div className="book-actions">
                  <a
                    href={volumeInfo.infoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="book-link"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {books.length === 0 && !loading && searchQuery && (
        <p className="no-results">No books found. Try a different search term.</p>
      )}
    </div>
  );
}

export default SearchPage;
