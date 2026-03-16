function Sidebar({ containers, active, onSelect, onDelete, onCreate, onMove, loading }) {
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [dragOverItem, setDragOverItem] = React.useState(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (showNew && inputRef.current) inputRef.current.focus(); }, [showNew]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  const handleDragOver = (e, container) => {
    e.preventDefault();
    if (dragOverItem !== container) setDragOverItem(container);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, targetContainer) => {
    e.preventDefault();
    setDragOverItem(null);
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const { container: sourceContainer, blob: sourceBlob } = JSON.parse(data);
      if (sourceContainer === targetContainer) return;
      
      const targetBlob = sourceBlob; // Keep same name for simplicity or we can add folder logic later
      const ok = await onMove(sourceContainer, sourceBlob, targetContainer, targetBlob);
      if (ok && active === targetContainer) {
        // If the target container is currently active, we need to signal it to refresh
        // This is handled by loadItems in BlobList which reacts to 'active' or we can add a refresh prop
        // But for now, since it's the same container, we might need a more explicit refresh.
        // Actually, onSelect(active) might trigger a re-render if we are lucky, 
        // but better to have App handle it or use a simpler approach.
        onSelect(targetContainer); 
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Kontejnery</span>
        <button className="btn btn-sm btn-icon" onClick={() => setShowNew(s => !s)} title="Novy kontejner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      {showNew && (
        <div className="new-container-form">
          <input ref={inputRef} type="text" placeholder="Nazev..." value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} />
          <button className="btn btn-sm btn-primary" onClick={handleCreate}>OK</button>
        </div>
      )}
      <div className="sidebar-list">
        {loading ? (
          <div className="loading-state" style={{ padding: '20px' }}><div className="spinner" /></div>
        ) : containers.map(c => (
          <div 
            key={c} 
            className={'sidebar-item' + (c === active ? ' active' : '') + (dragOverItem === c ? ' drag-over' : '')} 
            onClick={() => onSelect(c)}
            onDragOver={e => handleDragOver(e, c)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, c)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
            </div>
            <button className="del-container" onClick={e => { e.stopPropagation(); onDelete(c); }} title="Smazat kontejner">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
