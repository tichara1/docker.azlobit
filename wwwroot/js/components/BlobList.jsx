function BlobList({ container, refreshKey, selectedBlob, onBlobSelect, onMove, showToast }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  const [sortCol, setSortCol] = React.useState('date');
  const [sortDir, setSortDir] = React.useState('desc');
  const [currentPath, setCurrentPath] = React.useState(''); // e.g. "folder/" or "folder/sub/"
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [dragOverItem, setDragOverItem] = React.useState(null);

  const loadItems = React.useCallback(() => {
    const url = `/api/blobs/${encodeURIComponent(container)}?prefix=${encodeURIComponent(currentPath)}`;
    fetch(url)
      .then(r => r.json())
      .then(i => { setItems(i); setLoading(false); })
      .catch(e => { showToast('Chyba: ' + e.message); setLoading(false); });
  }, [container, currentPath, showToast]);

  React.useEffect(() => { loadItems(); }, [loadItems, refreshKey]);
  React.useEffect(() => { setFilter(''); setCurrentPath(''); }, [container]);

  const handleDelete = async (name) => {
    if (!confirm('Opravdu smazat ' + name + '?')) return;
    try {
      const r = await fetch('/delete/' + encodeURIComponent(container) + '/' + encodeURIComponent(name), { method: 'DELETE' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast('Smazano: ' + name);
      loadItems();
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir(col === 'date' ? 'desc' : 'asc'); }
  };

  const sorted = React.useMemo(() => {
    let list = [...items];
    if (filter) list = list.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));
    list.sort((a, b) => {
      // Folders always first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let va, vb;
      if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortCol === 'size') { va = a.size || 0; vb = b.size || 0; }
      else { va = new Date(a.lastModified || 0).getTime(); vb = new Date(b.lastModified || 0).getTime(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, filter, sortCol, sortDir]);

  const navigateToFolder = (path) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join('/') + '/' : '');
  };

  const handleDragStart = (e, item) => {
    if (item.isFolder) return;
    setDraggedItem(item.name);
    e.dataTransfer.setData('application/json', JSON.stringify({
      container,
      blob: item.name
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetItem) => {
    if (!targetItem.isFolder) return;
    e.preventDefault();
    if (dragOverItem !== targetItem.name) setDragOverItem(targetItem.name);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, targetItem) => {
    if (!targetItem.isFolder) return;
    e.preventDefault();
    setDragOverItem(null);
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const { container: sourceContainer, blob: sourceBlob } = JSON.parse(data);
      const fileName = sourceBlob.split('/').pop();
      const targetBlob = targetItem.name + fileName;
      
      const ok = await onMove(sourceContainer, sourceBlob, container, targetBlob);
      if (ok) loadItems();
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nazev nove slozky:');
    if (!name) return;
    
    const folderPath = currentPath + name + '/';
    // Create a .keep file to make the folder "exist" in Blob Storage
    const keepFilePath = folderPath + '.keep';
    
    try {
      const r2 = await fetch(`/save/${encodeURIComponent(container)}/${encodeURIComponent(keepFilePath)}`, {
        method: 'PUT',
        body: ''
      });
      
      if (!r2.ok) throw new Error('HTTP ' + r2.status);
      showToast('Slozka vytvorena: ' + name);
      loadItems();
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  const handleDeleteFolder = async (prefix) => {
    if (!confirm('Opravdu smazat slozku ' + prefix + ' a VSECHNY soubory v ni?')) return;
    try {
      const r = await fetch(`/delete-folder/${encodeURIComponent(container)}/${encodeURIComponent(prefix)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      showToast(`Slozka smazana (${j.deletedCount} souboru)`);
      loadItems();
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  if (selectedBlob) {
    return <BlobView container={container} blobName={selectedBlob} onBack={() => { onBlobSelect(null); loadItems(); }} showToast={showToast} />;
  }

  const arrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  // Breadcrumbs for folder navigation
  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return (
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '14px' }}>
        <a onClick={() => setCurrentPath('')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Root</a>
        {parts.map((p, idx) => {
          const path = parts.slice(0, idx + 1).join('/') + '/';
          return (
            <React.Fragment key={path}>
              <span style={{ opacity: 0.3 }}>/</span>
              <a onClick={() => setCurrentPath(path)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>{p}</a>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="container-title">{container}</div>
      {renderBreadcrumbs()}
      
      <Dropzone container={container} currentPath={currentPath} onUploaded={loadItems} showToast={showToast} />
      
      <div className="toolbar" style={{ justifyContent: 'space-between', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input className="filter-input" style={{ paddingLeft: '32px' }} type="text" placeholder="Filtrovat..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <button className="btn" onClick={loadItems} title="Obnovit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          </button>
        </div>
        
        <button className="btn btn-primary" onClick={handleCreateFolder}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          Nova slozka
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /> Nacitani...</div>
      ) : (
        <table>
          <thead><tr>
            <th className={sortCol === 'name' ? 'active' : ''} onClick={() => handleSort('name')}>
              Nazev<span className="sort-arrow">{arrow('name') || ' \u25B2'}</span>
            </th>
            <th className={sortCol === 'size' ? 'active' : ''} onClick={() => handleSort('size')}>
              Velikost<span className="sort-arrow">{arrow('size') || ' \u25B2'}</span>
            </th>
            <th>Typ</th>
            <th className={sortCol === 'date' ? 'active' : ''} onClick={() => handleSort('date')}>
              Nahrano<span className="sort-arrow">{arrow('date') || ' \u25B2'}</span>
            </th>
            <th style={{ textAlign: 'right' }}>Akce</th>
          </tr></thead>
          <tbody>
            {currentPath && (
              <tr style={{ cursor: 'pointer' }} onClick={navigateUp}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>..</span>
                  </div>
                </td>
                <td colSpan="4"></td>
              </tr>
            )}
            {sorted.map(i => (
              <tr 
                key={i.name}
                draggable={!i.isFolder}
                onDragStart={e => handleDragStart(e, i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, i)}
                className={(draggedItem === i.name ? 'drag-source' : '') + (dragOverItem === i.name ? ' drag-over' : '')}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {i.isFolder ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        <a href="#" onClick={e => { e.preventDefault(); navigateToFolder(i.name); }}>{i.name.split('/').filter(Boolean).pop()}</a>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <a href="#" onClick={e => { e.preventDefault(); onBlobSelect(i.name); }}>{i.name.split('/').pop()}</a>
                      </>
                    )}
                  </div>
                </td>
                <td className="size">{i.isFolder ? '-' : formatSize(i.size)}</td>
                <td className="size">{i.isFolder ? 'Folder' : (i.type || '-')}</td>
                <td className="date">{i.isFolder ? '-' : fmtDate(i.lastModified)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    {i.isFolder ? (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFolder(i.name)} title="Smazat slozku">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    ) : (
                      <>
                        <a className="btn btn-sm" href={'/download/' + encodeURIComponent(container) + '/' + encodeURIComponent(i.name)} title="Stahnout">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </a>
                        <button className="btn btn-sm" onClick={() => onBlobSelect(i.name)} title="Zobrazit">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i.name)} title="Smazat">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
