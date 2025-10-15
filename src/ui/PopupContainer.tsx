import React, { useState } from 'react';
import Popup from './overlay/Popup';
import { buildPrompt } from '../../utils/promptBuilder';

export default function PopupContainer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const handleAction = async (mode: 'summarize' | 'rewrite' | 'ideate') => {
    if (!text.trim()) return;
    setLoading(true);
    const prompt = buildPrompt(text, mode);
    // Mock AI call — replace with actual Chrome AI interaction
    const result = `${mode.toUpperCase()}: ${prompt}`;
    setOutput(result);
    setLoading(false);
  };

  return (
    <Popup
      text={text}
      setText={setText}
      loading={loading}
      output={output}
      onAction={handleAction}
    />
  );
}
