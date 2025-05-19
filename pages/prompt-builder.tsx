// File: /pages/prompt-builder.tsx

import { useState, useEffect } from 'react';
import Head from 'next/head';

const PromptBuilder = () => {
  const [profileName, setProfileName] = useState('Éana');
  const [userPreferences, setUserPreferences] = useState({
    answer_length: undefined,
    style_mode: undefined,
    guidance_mode: undefined,
    tone_preference: undefined,
  });
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuild = async () => {
    setLoading(true);
    const res = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileName, userPreferences }),
    });
    const data = await res.json();
    setSystemPrompt(data.systemPrompt || '');
    setLoading(false);
  };

  return (
    <div className="reflecta-builder-container">
      <Head>
        <title>Reflecta Prompt Builder</title>
      </Head>

      <h1 className="reflecta-title">Reflecta Prompt Builder</h1>

      <label>Válassz profilt:</label>
      <select value={profileName} onChange={(e) => setProfileName(e.target.value)}>
        <option value="Akasza">Akasza</option>
        <option value="Éana">Éana</option>
        <option value="Luma">Luma</option>
        <option value="Sylva">Sylva</option>
        <option value="Zentó">Zentó</option>
        <option value="Kairos">Kairos</option>
        <option value="Noe">Noe</option>
      </select>

      <div className="reflecta-switches">
        <label>
          <input type="checkbox" onChange={(e) => setUserPreferences(prev => ({
            ...prev, answer_length: e.target.checked ? 'short' : undefined }))} />
          Rövid válaszok
        </label>
        <label>
          <input type="checkbox" onChange={(e) => setUserPreferences(prev => ({
            ...prev, style_mode: e.target.checked ? 'symbolic' : undefined }))} />
          Szimbolikus stílus
        </label>
        <label>
          <input type="checkbox" onChange={(e) => setUserPreferences(prev => ({
            ...prev, guidance_mode: e.target.checked ? 'guided' : undefined }))} />
          Vezetett válaszok
        </label>
        <label>
          <input type="checkbox" onChange={(e) => setUserPreferences(prev => ({
            ...prev, tone_preference: e.target.checked ? 'supportive' : undefined }))} />
          Támogató hangnem
        </label>
      </div>

      <button className="reflecta-button" onClick={handleBuild} disabled={loading}>
        {loading ? 'Generálás...' : 'Prompt létrehozása'}
      </button>

      <textarea className="reflecta-output" rows={20} value={systemPrompt} readOnly />
    </div>
  );
};

export default PromptBuilder;
