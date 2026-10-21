import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [message, setMessage] = useState('Checking backend and database…');
  useEffect(() => {
    fetch('/api/environment').then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: { status: string; database: string } = await response.json();
      if (result.status !== 'ready' || result.database !== 'H2') throw new Error('Unexpected check result');
      setMessage('Environment ready');
    }).catch(error => setMessage(`Check failed: ${String(error)}`));
  }, []);
  return <main style={{fontFamily:'system-ui',maxWidth:720,margin:'80px auto',padding:24}}>
    <h1>Environment Check</h1><p role="status">{message}</p>
    <p>Java, Spring Boot, H2, React and TypeScript are checked together.</p>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
