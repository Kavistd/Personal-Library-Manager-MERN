import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingBookId, setSavingBookId] = useState(null);
  const [savedBookIds, setSavedBookIds] = useState(new Set()); // Track saved book IDs
  const [startIndex, setStartIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch user's saved books to check which ones are already saved
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedBooks();
    } else {
      setSavedBookIds(new Set());
    }
  }, [isAuthenticated]);

  const fetchSavedBooks = async () => {
    try {
      const response = await api.get('/books');
      const savedIds = new Set(response.data.map(book => book.googleBookId));
      setSavedBookIds(savedIds);
    } catch (err) {
      // Silently fail - user might not have any saved books yet
      console.error('Failed to fetch saved books:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setStartIndex(0);
    handleSearchAsync(0, true);
  };

  const handleLoadMore = () => {
    // Fetch outside the state updater: StrictMode runs updaters twice,
    // which would trigger duplicate requests and duplicate results
    const nextIndex = startIndex + 20;
    setStartIndex(nextIndex);
    handleSearchAsync(nextIndex, false);
  };

  const handleSearchAsync = async (searchStartIndex = 0, reset = true) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Google Books API search with pagination
      // Optional API key: keyless requests share a small daily quota and often get 429
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20&startIndex=${searchStartIndex}${keyParam}`;

      // Google Books intermittently returns 503 "backendFailed"; retry a few times with backoff
      let response;
      for (let attempt = 0; attempt < 4; attempt++) {
        response = await fetch(url);
        if (response.status < 500 || attempt === 3) break;
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }

      if (response.status >= 500) {
        throw new Error('Google Books is temporarily unavailable. Please try again in a moment.');
      }

      if (response.status === 429) {
        throw new Error(
          apiKey
            ? 'Google Books API quota exceeded for your API key. Please try again later.'
            : 'Google Books API quota exceeded. Set VITE_GOOGLE_BOOKS_API_KEY in client/.env to use your own quota.'
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.items) {
        if (reset) {
          setBooks(data.items);
        } else {
          setBooks(prev => [...prev, ...data.items]);
        }
        setTotalItems(data.totalItems || 0);
      } else {
        if (reset) setBooks([]);
        setTotalItems(0);
      }
      setHasSearched(true);
      if (reset) setStartIndex(0);
    } catch (err) {
      setError(err.message || 'Failed to search books. Please check your connection and try again.');
      console.error('Search error:', err);
      if (reset) setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async (book) => {
    if (!isAuthenticated) {
      return;
    }

    // Check if already saved
    if (savedBookIds.has(book.id)) {
      return;
    }

    const volumeInfo = book.volumeInfo || {};
    
    // Extract book data with safe handling for undefined fields
    // Only send fields that the backend expects
    const bookData = {
      googleBookId: book.id || '',
      title: volumeInfo.title || 'Untitled',
      authors: volumeInfo.authors || [],
      description: volumeInfo.description || '',
      thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
      infoLink: volumeInfo.infoLink || volumeInfo.canonicalVolumeLink || '',
    };

    // Validate required fields
    if (!bookData.googleBookId || !bookData.title) {
      alert('Cannot save book: missing required information');
      return;
    }

    setSavingBookId(book.id);

    try {
      await api.post('/books', bookData);
      // Add to saved books set
      setSavedBookIds(prev => new Set([...prev, book.id]));
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already saved')) {
        // Book is already saved, add to set
        setSavedBookIds(prev => new Set([...prev, book.id]));
      } else {
        alert('Failed to save book. Please try again.');
      }
    } finally {
      setSavingBookId(null);
    }
  };

  const truncateDescription = (description, maxLength = 150) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="search-page">
      <div className="search-hero">
        <span className="hero-eyebrow">Your personal library</span>
        <h1>Find your next <em>favorite</em> book</h1>
        <p>Search millions of titles from Google Books, save the ones you love and track what you read.</p>
      </div>
      
      <div className="search-page-content">
        <form onSubmit={handleSearch} className="search-form" role="search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author or keyword"
            className="search-input"
            aria-label="Search books"
          />
          <button type="submit" disabled={loading || !searchQuery.trim()} className="search-button">
            {loading && startIndex === 0 ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && startIndex === 0 && <LoadingSpinner message="Searching for books…" />}

        {!loading && hasSearched && books.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <h3>No books found</h3>
            <p>Try a different search term or check your spelling.</p>
          </div>
        )}

        {books.length > 0 && (
          <div className="books-grid">
          {books.map((book) => {
            const volumeInfo = book.volumeInfo || {};
            const thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
            const title = volumeInfo.title || 'No Title';
            const subtitle = volumeInfo.subtitle || '';
            const authors = volumeInfo.authors || [];
            const description = volumeInfo.description || '';
            const infoLink = volumeInfo.infoLink || volumeInfo.canonicalVolumeLink || '#';
            
            return (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  <span className="book-cover-placeholder" aria-hidden="true">{title.charAt(0)}</span>
                  {thumbnail && (
                    <img
                      src={thumbnail.replace('http://', 'https://')}
                      alt={title}
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
                  <h3>{title}</h3>
                  {subtitle && <h4 className="book-subtitle">{subtitle}</h4>}
                  <p className="book-authors">
                    {authors.length > 0 ? authors.join(', ') : 'Unknown Author'}
                  </p>
                  {description && (
                    <p className="book-description">
                      {truncateDescription(description)}
                    </p>
                  )}
                  <div className="book-actions">
                    {isAuthenticated && (
                      <button
                        onClick={() => handleSaveBook(book)}
                        disabled={savingBookId === book.id || savedBookIds.has(book.id)}
                        className={savedBookIds.has(book.id) ? 'btn-save saved' : 'btn-save'}
                      >
                        {savingBookId === book.id
                          ? 'Saving…'
                          : savedBookIds.has(book.id)
                          ? '✓ Saved'
                          : '+ Save'}
                      </button>
                    )}
                    {infoLink && infoLink !== '#' && (
                      <a
                        href={infoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="book-link"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {books.length > 0 && (!loading || startIndex > 0) && (
          <div className="pagination-info">
            <p>Showing {books.length} of {totalItems.toLocaleString()} results</p>
            {books.length < totalItems && (
              <button 
                onClick={handleLoadMore} 
                className="btn-load-more"
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load more books'}
              </button>
            )}
          </div>
        )}

        {!isAuthenticated && books.length > 0 && (
          <div className="auth-prompt">
            <p>
              <Link to="/login">Log in</Link> or <Link to="/signup">create an account</Link> to save books to your library.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
