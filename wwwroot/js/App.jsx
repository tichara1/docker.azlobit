function App() {
  const [containers, setContainers] = React.useState([]);
  const [containersLoading, setContainersLoading] = React.useState(true);
  const [active, setActive] = React.useState(null);
  const [selectedBlob, setSelectedBlob] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [toastMsg, showToast] = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState(null);
  const [searching, setSearching] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const triggerRefresh = React.useCallback(() => setRefreshKey(prev => prev + 1), []);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      triggerRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, triggerRefresh]);

  const loadContainers = React.useCallback(async () => {
    setContainersLoading(true);
    try {
      const r = await fetch('/api/containers');
      setContainers(await r.json());
    } catch (e) { showToast('Chyba: ' + e.message); }
    setContainersLoading(false);
  }, [showToast]);

  React.useEffect(() => { loadContainers(); }, [loadContainers]);

  // Handle hash for navigation and refresh
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (!hash) {
        setActive(null);
        setSelectedBlob(null);
      } else {
        const parts = hash.split('/');
        const container = decodeURIComponent(parts[0]);
        const blob = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : null;
        setActive(container);
        setSelectedBlob(blob);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => {
    if (active) {
      let hash = '#' + encodeURIComponent(active);
      if (selectedBlob) hash += '/' + encodeURIComponent(selectedBlob);
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }
    } else if (window.location.hash && !searching && searchResults === null) {
      window.history.pushState(null, '', '#');
    }
  }, [active, selectedBlob]);

  const handleCreateContainer = async (name) => {
    try {
      const r = await fetch('/api/containers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'HTTP ' + r.status); }
      showToast('Kontejner vytvoren: ' + name);
      await loadContainers();
      setActive(name);
      setSearchResults(null);
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  const handleDeleteContainer = async (name) => {
    if (!confirm('Opravdu smazat kontejner ' + name + ' a vsechny jeho bloby?')) return;
    try {
      const r = await fetch('/api/containers/' + encodeURIComponent(name), { method: 'DELETE' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast('Kontejner smazan: ' + name);
      if (active === name) setActive(null);
      loadContainers();
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  const handleModalClose = (reconnected) => {
    setShowModal(false);
    if (reconnected) { setActive(null); setSearchResults(null); loadContainers(); }
  };

  const handleMove = async (sourceContainer, sourceBlob, targetContainer, targetBlob) => {
    if (sourceContainer === targetContainer && sourceBlob === targetBlob) return;
    try {
      const r = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContainer, sourceBlob, targetContainer, targetBlob })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast(`Presunuto do ${targetContainer}`);
      triggerRefresh();
      // Refresh current view if needed
      return true;
    } catch (e) {
      showToast('Chyba pri presunu: ' + e.message);
      return false;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true); setActive(null);
    try {
      const r = await fetch('/search?q=' + encodeURIComponent(searchQuery.trim()));
      setSearchResults(await r.json());
    } catch (e) { showToast('Chyba: ' + e.message); }
    setSearching(false);
  };

  const renderMain = () => {
    if (searching) return <div className="loading-state"><div className="spinner" /> Hledani...</div>;

    if (searchResults !== null) {
      return (
        <div>
          <div className="container-title">Vysledky hledani: "{searchQuery}"</div>
          <div className="container-sub">{searchResults.length} nalezeno</div>
          <button className="btn btn-sm" style={{ marginBottom: 12 }} onClick={() => setSearchResults(null)}>Zpet</button>
          <table>
            <thead><tr><th>Nazev</th><th>Kontejner</th><th>Velikost</th><th>Nahrano</th></tr></thead>
            <tbody>{searchResults.map((b, i) => (
              <tr key={i}>
                <td><a href="#" onClick={e => { e.preventDefault(); setSearchResults(null); setActive(b.container); setSelectedBlob(b.name); }}>{b.name}</a></td>
                <td className="size">{b.container}</td>
                <td className="size">{formatSize(b.size)}</td>
                <td className="date">{fmtDate(b.lastModified)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    }

    if (!active) return <Dashboard onBlobSelect={(container, blob) => { setActive(container); setSelectedBlob(blob); }} refreshKey={refreshKey} />;
    return <BlobList 
      key={active} 
      container={active} 
      refreshKey={refreshKey}
      selectedBlob={selectedBlob}
      onBlobSelect={setSelectedBlob}
      onMove={handleMove}
      showToast={showToast} 
    />;
  };

  return (
    <>
      <div className="header">
        <h1>Azlobit</h1>
        <div className="header-actions">
          <div className="auto-refresh-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, fontSize: '13px', opacity: 0.8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              <span>Auto-refresh (5s)</span>
            </label>
            {autoRefresh && (
               <div className="pulse-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }}></div>
            )}
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input className="filter-input" style={{ width: 220, paddingLeft: '32px' }} type="text" placeholder="Hledat blob..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </form>
          <button className="btn btn-icon" onClick={() => setShowModal(true)} title="Connection Info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </div>
      <div className="layout">
        <Sidebar containers={containers} active={active} loading={containersLoading}
          onSelect={c => { setActive(c); setSelectedBlob(null); setSearchResults(null); }}
          onDelete={handleDeleteContainer} onCreate={handleCreateContainer} onMove={handleMove} />
        <div className="main">{renderMain()}</div>
      </div>
      {showModal && <ConnectionModal onClose={handleModalClose} showToast={showToast} />}
      <Toast message={toastMsg} />
    </>
  );
}

function Dashboard({ onBlobSelect, refreshKey }) {
  const [recent, setRecent] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/recent-blobs')
      .then(r => r.json())
      .then(data => { setRecent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div>
      <div className="container-title">Dashboard</div>
      <div className="container-sub">Prehled uloziste</div>

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-bright)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Poslednich 5 vlozenych souboru
        </h3>
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : recent.length === 0 ? (
          <div className="main-empty" style={{ height: '100px', border: '1px dashed var(--border)', borderRadius: '8px' }}>Zadne soubory</div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Nazev</th>
                  <th>Kontejner</th>
                  <th>Velikost</th>
                  <th>Nahrano</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <a href="#" onClick={e => { e.preventDefault(); onBlobSelect(b.container, b.name); }}>{b.name}</a>
                      </div>
                    </td>
                    <td className="size">{b.container}</td>
                    <td className="size">{formatSize(b.size)}</td>
                    <td className="date">{fmtDate(b.lastModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="main-empty" style={{ marginTop: '40px', height: 'auto', padding: '40px' }}>
        Vyberte kontejner v levem menu pro prochazeni souboru.
      </div>
    </div>
  );
}