function BlobView({ container, blobName, onBack, showToast }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const editorRef = React.useRef(null);
  const highlightRef = React.useRef(null);

  React.useEffect(() => {
    setLoading(true);
    fetch('/view/' + encodeURIComponent(container) + '/' + encodeURIComponent(blobName), { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(d => {
        const formatted = formatContent(d.rawContent || '', blobName);
        setData({ ...d, rawContent: formatted });
        setEditContent(formatted);
        setLoading(false);
      })
      .catch(e => { setData({ error: e.message }); setLoading(false); });
  }, [container, blobName]);

  React.useEffect(() => {
    if (data && !isEditing && window.Prism) {
      window.Prism.highlightAll();
    }
  }, [data, isEditing]);

  const handleScroll = (e) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.target.scrollTop;
      highlightRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setEditContent(newValue);
      // Wait for React to update the DOM
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Opravdu smazat ' + blobName + '?')) return;
    try {
      const r = await fetch('/delete/' + encodeURIComponent(container) + '/' + encodeURIComponent(blobName), { method: 'DELETE' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast('Smazano: ' + blobName);
      onBack();
    } catch (e) { showToast('Chyba: ' + e.message); }
  };

  const handleSave = async () => {
    if (!confirm('Ulozit zmeny v ' + blobName + '?')) return;
    setIsSaving(true);
    try {
      const r = await fetch('/save/' + encodeURIComponent(container) + '/' + encodeURIComponent(blobName), {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: editContent
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast('Ulozeno: ' + blobName);
      setIsEditing(false);
      
      const r2 = await fetch('/view/' + encodeURIComponent(container) + '/' + encodeURIComponent(blobName), { headers: { Accept: 'application/json' } });
      const d = await r2.json();
      const formatted = formatContent(d.rawContent || '', blobName);
      setData({ ...d, rawContent: formatted });
      setEditContent(formatted);
    } catch (e) { showToast('Chyba pri ukladani: ' + e.message); }
    setIsSaving(false);
  };

  const getLanguageClass = () => {
    if (!blobName) return 'language-text';
    const ext = blobName.split('.').pop().toLowerCase();
    const xmlExts = ['xml', 'html', 'xaml', 'config', 'csproj', 'vbproj', 'resx'];
    if (xmlExts.includes(ext)) return 'language-markup';
    switch (ext) {
      case 'json': return 'language-json';
      case 'js':
      case 'jsx': return 'language-javascript';
      case 'cs': return 'language-csharp';
      default: return 'language-text';
    }
  };

  const syncHighlight = React.useCallback(() => {
    if (isEditing && window.Prism && highlightRef.current) {
      const code = highlightRef.current.querySelector('code');
      if (code) {
        code.textContent = editContent + (editContent.endsWith('\n') ? ' ' : '');
        window.Prism.highlightElement(code);
      }
    }
  }, [editContent, isEditing]);

  React.useEffect(() => {
    syncHighlight();
  }, [syncHighlight]);

  if (loading) return <div className="loading-state"><div className="spinner" /> Nacitani...</div>;
  if (data?.error) return <div className="main-empty">Chyba: {data.error}</div>;

  return (
    <div>
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <a onClick={onBack}>{container}</a>
        <span style={{ opacity: 0.3 }}>/</span>
        <span>{blobName}</span>
      </div>
      <div className="container-title">{blobName}</div>
      <div className="container-sub">{data.size} &middot; {data.contentType}</div>
      
      <div className="actions" style={{ marginBottom: '20px' }}>
        {isEditing ? (
          <>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {isSaving ? 'Ukladani...' : 'Ulozit'}
            </button>
            <button className="btn" onClick={() => { 
              const formatted = formatContent(data.rawContent, blobName);
              setEditContent(formatted);
              setIsEditing(false); 
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Zrusit
            </button>
            <button className="btn" onClick={() => setEditContent(formatContent(editContent, blobName))}>
              Formatovat
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => {
              setEditContent(formatContent(data.rawContent, blobName));
              setIsEditing(true);
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Upravit
            </button>
            <a className="btn" href={'/download/' + encodeURIComponent(container) + '/' + encodeURIComponent(blobName)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download
            </a>
            <button className="btn" onClick={() => {
              navigator.clipboard.writeText(data.rawContent).then(() => showToast('Zkopirovano!'));
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Kopirovat
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Smazat
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={onBack}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Zpet
            </button>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="edit-container" style={{ height: '70vh' }}>
          <pre className={`edit-highlight ${getLanguageClass()}`} ref={highlightRef}>
            <code className={getLanguageClass()} />
          </pre>
          <textarea
            className="edit-area"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck="false"
            ref={editorRef}
          />
        </div>
      ) : (
        <pre className={getLanguageClass()} id="blob-content">
          <code className={getLanguageClass()}>
            {data.rawContent}
          </code>
        </pre>
      )}
    </div>
  );
}
