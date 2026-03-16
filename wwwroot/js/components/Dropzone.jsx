function Dropzone({ container, currentPath = '', onUploaded, showToast }) {
  const [dragOver, setDragOver] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const fileRef = React.useRef(null);

  const upload = async (files) => {
    if (!files.length) return;
    setProgress('Nahravani ' + files.length + ' soubor(u)...');
    const fd = new FormData();
    for (const f of files) {
      const fileName = currentPath ? `${currentPath}${f.name}` : f.name;
      fd.append('files', f, fileName);
    }
    try {
      const r = await fetch('/upload/' + encodeURIComponent(container), { method: 'POST', body: fd });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      showToast('Nahrano ' + j.uploaded + ' soubor(u)');
      setProgress('');
      onUploaded();
    } catch (e) { setProgress('Chyba: ' + e.message); showToast('Chyba: ' + e.message); }
  };

  return (
    <div
      className={'dropzone' + (dragOver ? ' drag-over' : '')}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
    >
      <p>Pretahnete soubory sem pro nahrani</p>
      <span className="hint">nebo{' '}
        <label style={{ color: 'var(--accent)', cursor: 'pointer' }}>
          <input type="file" multiple hidden ref={fileRef} onChange={e => upload(e.target.files)} />
          vyberte soubory
        </label>
      </span>
      {progress && <div className="upload-progress">{progress}</div>}
    </div>
  );
}
