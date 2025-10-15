import React, { useEffect, useState } from 'react';
import Sidebar from './sidebar/Sidebar';
import { getCache, saveCache } from '../../storage/cache';
import { buildPrompt } from '../../utils/promptBuilder';

export default function SidebarContainer() {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCache().then((cached) => {
      if (cached && cached.responses) setResponses(cached.responses);
    });
  }, []);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const prompt = buildPrompt(input);
    // Mock AI call (replace with Chrome AI API integration)
    const output = `MuseFlow: ${prompt} ✨`;
    const updated = [output, ...responses].slice(0, 10);
    await saveCache({ responses: updated });
    setResponses(updated);
    setLoading(false);
    setInput('');
  };

  return (
    <Sidebar
      input={input}
      setInput={setInput}
      responses={responses}
      loading={loading}
      onGenerate={handleGenerate}
    />
  );
}
