import { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png'; 

function App() {
  // 1. STATE PRESERVATION (Read from URL on load)
  const searchParams = new URLSearchParams(window.location.search);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [size, setSize] = useState(parseInt(searchParams.get('size')) || 10);
  const [sort, setSort] = useState(searchParams.get('sort') || '-published_at');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null); // Added to track total pages and items

  // Header State
  const [showHeader, setShowHeader] = useState(true);
  const [isTransparent, setIsTransparent] = useState(false);

  // 2. UPDATE URL WHEN STATE CHANGES
  useEffect(() => {
    const params = new URLSearchParams({ page, size, sort });
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }, [page, size, sort]);

  // 3. DYNAMIC HEADER SCROLL LOGIC
  useEffect(() => {
    let lastScrollY = window.scrollY; // Local variable instead of React state

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowHeader(false); // Scrolling down
      } else {
        setShowHeader(true);  // Scrolling up
        setIsTransparent(currentScrollY > 50); // Transparent if not at the very top
      }
      
      lastScrollY = currentScrollY; // Update local variable
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); 

  // 4. API FETCHING
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Grab the base URL from the environment, or default to empty string for local proxy
        const baseUrl = import.meta.env.VITE_API_BASE_URL || ''; 
        
        const response = await fetch(
          `${baseUrl}/api/ideas?page[number]=${page}&page[size]=${size}&append[]=small_image&sort=${sort}`, 
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        const result = await response.json();
        setData(result.data || []);
        setMeta(result.meta || null);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [page, size, sort]);
console.log("My API Data:", data);
  return (
    <div className="app">
      <header className={`header ${showHeader ? 'visible' : 'hidden'} ${isTransparent ? 'transparent' : ''}`}>
        
        <a href="/" className="logo-link">
          <img src={logo} alt="Suitmedia Logo" className="logo-img" />
        </a>

        <nav>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#ideas" className="active">Ideas</a>
          <a href="#careers">Careers</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <div className="banner">
        <h1>Ideas</h1>
        <p>Where all our great things begin</p>
      </div>

      <main className="content-wrapper">
        <div className="controls-container">
          <p className="showing-text">
            Showing {meta ? meta.from : 0} - {meta ? meta.to : 0} of {meta ? meta.total : 0}
          </p>
          
          <div className="filters">
            <div className="filter-group">
              <label>Show per page:</label>
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="-published_at">Newest</option>
                <option value="published_at">Oldest</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid">
          {data.map(item => (
            <div key={item.id} className="card">
              <div className="card-image">
                {item.small_image && item.small_image.length > 0 && item.small_image[0].url ? (
                  <img 
                    src={item.small_image[0].url} 
                    alt={item.title} 
                    loading="lazy" 
                    onError={(e) => { 
                      // If the asset server's link is dead/404, fallback to grey box
                      e.target.style.display = 'none'; 
                      e.target.parentElement.style.backgroundColor = '#eee';
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }}></div>
                )}
              </div>
              <div className="card-content">
                <p className="date">
                  {new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
                <h3 title={item.title}>{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* UPDATED NUMBERED PAGINATION */}
        {meta && (
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              &laquo;
            </button>
            
            {Array.from({ length: Math.min(5, meta.last_page || 1) }, (_, i) => {
               const pageNum = i + 1; 
               return (
                 <button 
                   key={pageNum}
                   className={page === pageNum ? 'active' : ''}
                   onClick={() => setPage(pageNum)}
                 >
                   {pageNum}
                 </button>
               )
            })}

            <button onClick={() => setPage(p => p + 1)} disabled={page === (meta.last_page || 1)}>
              &raquo;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
