function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" style={{ opacity: 1 }}>{message}</div>;
}

function useToast() {
  const [msg, setMsg] = React.useState(null);
  const timer = React.useRef(null);
  const show = React.useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2000);
  }, []);
  return [msg, show];
}
