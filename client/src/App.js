import React, { useState, useEffect, useCallback } from "react";
import LinkForm from "./components/LinkForm";
import LinkList from "./components/LinkList";

function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Uses proxy
      const response = await fetch("http://localhost:5001/api/links");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLinks(data);
    } catch (err) {
      console.error("Failed to fetch links:", err);
      setError(err.message || "Failed to fetch links.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function doesn't change

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]); // Fetch links on initial mount

  const handleLinkCreated = (newLink) => {
    // Add the new link to the top of the list immediately
    setLinks([newLink, ...links]);
    // Or optionally refetch the whole list: fetchLinks();
  };

  return (
    <div
      className="App"
      style={{
        maxWidth: "800px",
        margin: "20px auto",
        fontFamily: "sans-serif",
      }}
    >
      <header className="App-header">
        <h1>Dynamic Links Dashboard</h1>
        <p>High-Level Overview: Create and manage dynamic links.</p>
      </header>
      <main>
        <LinkForm onLinkCreated={handleLinkCreated} />
        <LinkList links={links} loading={loading} error={error} />
      </main>
    </div>
  );
}

export default App;
