import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Theme, Agent, Metrics, AVAILABLE_MODELS } from './types';
import { THEMES, DEFAULT_AGENTS, INITIAL_YAML, INITIAL_SKILL_MD } from './constants';
import StatusHUD from './components/StatusHUD';
import Dashboard from './components/Dashboard';
import { callGemini } from './services/geminiService';
import { Layout, FileText, Settings, BookOpen, PenTool, ClipboardList, Wand2, Upload, Download, Play, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// --- Tab Components (Internal to App for shared state access simplicity in this format) ---

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [appState, setAppState] = useState<AppState>({
    health: 100,
    mana: 100,
    xp: 0,
    level: 1,
    stress: 0,
    themeId: THEMES[0].id,
    language: 'en',
  });

  const [activeTab, setActiveTab] = useState('summary');
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [agentsYaml, setAgentsYaml] = useState(INITIAL_YAML);
  const [skillMd, setSkillMd] = useState(INITIAL_SKILL_MD);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRuns: 0,
    providerCalls: { gemini: 0, openai: 0, anthropic: 0, xai: 0 },
    tokensUsed: 0,
    lastRunDuration: 0,
  });

  const [loading, setLoading] = useState(false);

  // Feature specific states
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryOutput, setSummaryOutput] = useState('');
  
  const [guidanceInput, setGuidanceInput] = useState('');
  const [guidanceOutput, setGuidanceOutput] = useState('');
    const [guidancePrompt, setGuidancePrompt] = useState("Create a comprehensive review guideline with a checklist based on the provided text.");

  const [ocrInput, setOcrInput] = useState(''); // Text content extracted from PDF
  const [ocrOutput, setOcrOutput] = useState(''); // Summary/Analysis
  const [ocrAgentId, setOcrAgentId] = useState(agents[0].id);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [pagesToOcr, setPagesToOcr] = useState<string>('1-1');
    const [ocrModel, setOcrModel] = useState<string>(AVAILABLE_MODELS[0]);

    // PDF text extraction helper using pdfjs
    const extractPdfText = async (file: File, pagesSpec: string) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;

            // parse pagesSpec like "1-3,5"
            const ranges = pagesSpec.split(',').map(s => s.trim()).filter(Boolean);
            const pages: number[] = [];
            for (const r of ranges) {
                if (r.includes('-')) {
                    const [a,b] = r.split('-').map(x => parseInt(x.trim(),10));
                    if (!isNaN(a) && !isNaN(b)) {
                        for (let i = Math.max(1,a); i <= Math.min(b,numPages); i++) pages.push(i);
                    }
                } else {
                    const p = parseInt(r,10);
                    if (!isNaN(p) && p >= 1 && p <= numPages) pages.push(p);
                }
            }
            // if no pages parsed, default to 1..min(5,numPages)
            if (pages.length === 0) {
                for (let i = 1; i <= Math.min(5, numPages); i++) pages.push(i);
            }

            let fullText = '';
            for (const p of pages) {
                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                const pageText = content.items.map((it: any) => it.str).join(' ');
                fullText += `\n\n--- PAGE ${p} ---\n\n` + pageText;
            }
            return fullText.trim();
        } catch (err) {
            console.error('PDF extract error', err);
            return '';
        }
    };

  const [noteInput, setNoteInput] = useState('');
  const [noteOutput, setNoteOutput] = useState('');
  const [noteKeywords, setNoteKeywords] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0] || '');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [geminiKeyFromEnv, setGeminiKeyFromEnv] = useState(false);
    const [openaiKeyFromEnv, setOpenaiKeyFromEnv] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // Apply Theme
    const theme = THEMES.find(t => t.id === appState.themeId) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-bg', theme.colors.bg);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
  }, [appState.themeId]);

    // Load saved keys and selected model from localStorage, but prefer env values (don't expose them)
    useEffect(() => {
        try {
            const env = (import.meta as any)?.env || {};
            const envGemini = env?.VITE_API_KEY || env?.VITE_GEMINI_API_KEY || '';
            const envOpenai = env?.VITE_OPENAI_API_KEY || '';

            if (envGemini) {
                setGeminiKeyFromEnv(true);
                setGeminiApiKey('');
            } else {
                const g = localStorage.getItem('gemini_api_key') || '';
                setGeminiApiKey(g);
            }

            if (envOpenai) {
                setOpenaiKeyFromEnv(true);
                setOpenaiApiKey('');
            } else {
                const o = localStorage.getItem('openai_api_key') || '';
                setOpenaiApiKey(o);
            }

            const m = localStorage.getItem('selected_model') || AVAILABLE_MODELS[0] || '';
            setSelectedModel(m);
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => { localStorage.setItem('gemini_api_key', geminiApiKey || ''); }, [geminiApiKey]);
    useEffect(() => { localStorage.setItem('openai_api_key', openaiApiKey || ''); }, [openaiApiKey]);
    useEffect(() => { localStorage.setItem('selected_model', selectedModel || ''); }, [selectedModel]);

  // --- Helpers ---
  const updateMetrics = (provider: string, duration: number, tokens: number) => {
    setMetrics(prev => ({
      totalRuns: prev.totalRuns + 1,
      providerCalls: { ...prev.providerCalls, [provider]: (prev.providerCalls[provider] || 0) + 1 },
      tokensUsed: prev.tokensUsed + tokens,
      lastRunDuration: duration
    }));
    setAppState(prev => ({
      ...prev,
      mana: Math.max(0, prev.mana - 5),
      xp: prev.xp + 15,
      level: Math.floor((prev.xp + 15) / 100) + 1,
      stress: Math.min(100, prev.stress + 2)
    }));
  };

  const handleRunAI = async (
    prompt: string, 
    userContent: string, 
    model: string, 
    setOutput: (s: string) => void,
    config: { maxTokens?: number } = {}
  ) => {
    if (appState.mana < 5) {
      alert("Not enough Mana! Wait for recharge.");
      return;
    }
        // Validate model/provider and keys
        const env = (import.meta as any)?.env || {};
        const envGemini = env?.VITE_API_KEY || env?.VITE_GEMINI_API_KEY || '';
        const hasGeminiKey = !!(geminiApiKey || envGemini);

        if (model.startsWith('gemini') && !hasGeminiKey) {
            alert('Gemini model selected but no Gemini API key configured. Add it in the Keys sidebar or set VITE_API_KEY.');
            return;
        }

        if (!model.startsWith('gemini')) {
            alert('Selected model appears to be non-Gemini. In-browser support is limited; use a server proxy for other providers.');
            return;
        }

        setLoading(true);
    const start = Date.now();
        try {
            const result = await callGemini(
                model,
                prompt,
                userContent,
                0.5,
                config.maxTokens || 4000,
                geminiApiKey // use user-provided key if present
            );
      setOutput(result);
      updateMetrics('gemini', (Date.now() - start) / 1000, 100); // approx tokens
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJackpot = () => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setAppState(prev => ({ ...prev, themeId: randomTheme.id }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setText: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate PDF/Text reading
    const reader = new FileReader();
    reader.onload = (ev) => {
        // In a real app, use pdfjs-dist here for PDFs. 
        // For this demo, we assume text files or treat the result as text.
        // If it's a PDF in this mock, we just say "PDF Content Loaded"
        if(file.type === 'application/pdf') {
            setText(`[Simulated PDF Content for ${file.name}]\n\nSECTION 5. 510(k) SUMMARY\n\nDevice Name: SuperMed 2000\nIndication: For measuring blood pressure.\n... (Real OCR would happen here)`);
        } else {
            setText(ev.target?.result as string);
        }
    };
    reader.readAsText(file);
  };

  // --- Render Sections ---

  const renderSummaryTab = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><FileText /> 510(k) Summary Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-semibold mb-2">Input (Text/Markdown) or Upload PDF</label>
                <div className="flex gap-2 mb-2">
                    <input type="file" className="text-sm" accept=".txt,.md,.pdf" onChange={(e) => handleFileUpload(e, setSummaryInput)} />
                </div>
                <textarea 
                    className="w-full h-64 p-3 rounded-lg bg-background/50 border border-white/10 focus:ring-2 focus:ring-primary outline-none resize-none"
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    placeholder="Paste summary content here..."
                />
            </div>
            <div className="relative">
                <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold">Analysis Output</span>
                     <button 
                        onClick={() => handleRunAI(
                            "Create a comprehensive summary of this 510(k) document in markdown. Highlight key regulatory terms (like 'Predicate', 'Indication', 'SE') by wrapping them in spans with class 'text-coral' or simply ensure they stand out.", 
                            summaryInput, 
                            selectedModel, 
                            setSummaryOutput
                        )}
                        className="bg-primary hover:bg-opacity-90 text-white px-4 py-1 rounded-full text-sm flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Play size={14} /> Analyze
                    </button>
                </div>
                <div className="w-full h-64 p-3 rounded-lg bg-background/50 border border-white/10 overflow-y-auto markdown-body">
                    {loading && <LoadingOverlay />}
                    <ReactMarkdown 
                        components={{
                            strong: ({node, ...props}) => <span className="text-coral font-bold" {...props} />
                        }}
                    >
                        {summaryOutput}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderGuidanceTab = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen /> Review Guidance Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <textarea 
                className="md:col-span-2 w-full h-32 p-3 rounded-lg bg-background/50 border border-white/10"
                value={guidanceInput}
                onChange={(e) => setGuidanceInput(e.target.value)}
                placeholder="Paste guidance text or instructions..."
            />

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">System Prompt (editable)</label>
                <textarea className="h-24 p-2 rounded bg-black/20 border border-white/10 text-sm" value={guidancePrompt} onChange={e => setGuidancePrompt(e.target.value)} />
                <label className="text-sm font-semibold">Model</label>
                <select className="p-2 rounded bg-black/20 border border-white/10 text-sm" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                    {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => handleRunAI(guidancePrompt, guidanceInput, selectedModel, setGuidanceOutput)} className="mt-2 bg-accent text-white px-4 py-2 rounded">Generate Checklist</button>
            </div>
        </div>

        <div className="bg-background/50 p-4 rounded-lg min-h-[200px] markdown-body">
             {loading && <LoadingOverlay />}
             <ReactMarkdown>{guidanceOutput}</ReactMarkdown>
        </div>
      </div>
    </div>
  );

  const renderSubmissionTab = () => (
    <div className="space-y-4 animate-fadeIn">
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ClipboardList /> Submission OCR & Review</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Upload & Preview */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer">
                        <Upload className="mx-auto mb-2 opacity-70" />
                        <p className="text-sm">Upload Submission PDF</p>
                        <input type="file" className="opacity-0 absolute inset-0 cursor-pointer" accept=".pdf" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPdfFile(file);
                            const url = URL.createObjectURL(file);
                            setPdfUrl(url);
                            // keep text placeholder in editor
                            handleFileUpload(e, setOcrInput);
                        }} />
                    </div>
                    {ocrInput && (
                        <div className="bg-white text-black p-4 rounded h-64 overflow-y-auto text-xs font-mono">
                            <p className="text-gray-500 italic mb-2">-- Simulated OCR Preview (Page 1-5) --</p>
                            {ocrInput}
                        </div>
                    )}
                    {pdfUrl && (
                        <div>
                            <label className="text-sm font-semibold">PDF Preview</label>
                            <iframe src={pdfUrl} className="w-full h-64 border rounded mt-2" />
                            <label className="text-sm font-semibold mt-2">Pages to OCR (e.g. 1-3,5)</label>
                            <input value={pagesToOcr} onChange={e => setPagesToOcr(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm mt-1" />
                        </div>
                    )}
                </div>

                {/* Middle: Editor */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                     <textarea 
                        className="flex-1 p-3 rounded-lg bg-background/50 border border-white/10 font-mono text-sm"
                        value={ocrInput}
                        onChange={(e) => setOcrInput(e.target.value)}
                        placeholder="OCR Text will appear here. You can edit it before analysis."
                    />
                    
                    <div className="flex gap-2 items-center bg-background/30 p-2 rounded-lg">
                        <span className="text-sm font-bold whitespace-nowrap">Model:</span>
                        <select className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm flex-1" value={ocrModel} onChange={e => setOcrModel(e.target.value)}>
                            {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button onClick={async () => {
                            // If a PDF file is loaded, extract text from selected pages first
                            let extracted = ocrInput;
                            if (pdfFile) {
                                extracted = await extractPdfText(pdfFile, pagesToOcr);
                            }
                            if (!extracted || extracted.trim().length === 0) {
                                alert('No text extracted. Please pick a PDF with selectable text or paste content into the editor.');
                                return;
                            }
                            const pagesNote = pagesToOcr ? `Pages: ${pagesToOcr}.` : '';
                            const prompt = `You are an expert document analyst. Extract and structure the important regulatory content from the following submission text (${pagesNote}). Produce a clean markdown report with headings: Summary, Device, Indication, Predicate, Key Findings, Action Items. Preserve section markers and include quoted snippets where relevant.`;
                            handleRunAI(prompt, extracted, ocrModel, setOcrOutput, { maxTokens: 2000 });
                        }} className="bg-secondary text-white px-4 py-1 rounded shadow hover:brightness-110">Execute OCR</button>
                    </div>

                    <div className="h-64 bg-background/50 rounded-lg p-4 overflow-y-auto markdown-body relative">
                        {loading && <LoadingOverlay />}
                        <ReactMarkdown>{ocrOutput}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderNoteKeeperTab = () => (
     <div className="space-y-4 animate-fadeIn">
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><PenTool /> AI Note Keeper & Magics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <textarea 
                        className="w-full h-96 p-4 rounded-lg bg-background/50 border border-white/10 focus:ring-2 focus:ring-accent outline-none"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Take raw notes here..."
                    />
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Keywords (comma separated) for Coral highlight" 
                            className="flex-1 bg-background/50 border border-white/10 rounded px-3 py-2 text-sm"
                            value={noteKeywords}
                            onChange={(e) => setNoteKeywords(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 items-end">
                        <div className="flex gap-2">
                            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="p-2 rounded bg-black/20 border border-white/10 text-sm">
                                {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleRunAI(`Organize these notes into structured markdown. Highlight these keywords in coral color using HTML span style: ${noteKeywords}`, noteInput, selectedModel, setNoteOutput)} className="bg-primary/80 hover:bg-primary p-2 rounded text-xs"> <Wand2 size={12}/> Organize</button>
                            <button onClick={() => handleRunAI(`Extract action items and format as a checklist.`, noteInput, selectedModel, setNoteOutput)} className="bg-secondary/80 hover:bg-secondary p-2 rounded text-xs"> <ClipboardList size={12}/> Action Items</button>
                            <button onClick={() => handleRunAI(`Explain technical terms found in the notes in a glossary format.`, noteInput, selectedModel, setNoteOutput)} className="bg-accent/80 hover:bg-accent p-2 rounded text-xs"> <BookOpen size={12}/> Glossary</button>
                            <button onClick={() => handleRunAI(`Rewrite these notes to be more professional and concise for an FDA report.`, noteInput, selectedModel, setNoteOutput)} className="bg-green-600/80 hover:bg-green-600 p-2 rounded text-xs"> <PenTool size={12}/> Polish</button>
                        </div>
                    </div>
                    
                    <div className="w-full h-[340px] p-4 rounded-lg bg-background/50 border border-white/10 overflow-y-auto markdown-body relative">
                        {loading && <LoadingOverlay />}
                         <ReactMarkdown 
                            components={{
                                span: ({node, ...props}) => <span style={{color: '#FF7F50', fontWeight: 'bold'}} {...props} />
                            }}
                        >
                            {noteOutput}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
     </div>
  );

  const renderConfigTab = () => (
      <div className="space-y-4 animate-fadeIn">
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Settings /> System Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2 flex justify-between">
                        agents.yaml 
                        <div className="flex gap-2">
                             <button className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Download size={12}/></button>
                             <button className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Upload size={12}/></button>
                        </div>
                    </h3>
                    <textarea 
                        className="w-full h-64 p-3 font-mono text-sm bg-black/30 rounded border border-white/10"
                        value={agentsYaml}
                        onChange={(e) => setAgentsYaml(e.target.value)}
                    />
                </div>
                <div>
                    <h3 className="font-bold mb-2 flex justify-between">
                        SKILL.md
                         <div className="flex gap-2">
                             <button className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Download size={12}/></button>
                             <button className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Upload size={12}/></button>
                        </div>
                    </h3>
                    <textarea 
                        className="w-full h-64 p-3 font-mono text-sm bg-black/30 rounded border border-white/10"
                        value={skillMd}
                        onChange={(e) => setSkillMd(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
                <h3 className="font-bold mb-2">API Keys & Model</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-semibold">Gemini API Key</label>
                            {geminiKeyFromEnv ? (
                                <div className="text-sm italic text-green-400">Loaded from environment (hidden)</div>
                            ) : (
                                <>
                                    <input
                                        type="password"
                                        value={geminiApiKey}
                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                        placeholder="Paste Gemini API key"
                                        className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm"
                                    />
                                    <p className="text-xs opacity-70 mt-1">Stored locally in browser.</p>
                                </>
                            )}
                    </div>

                    <div>
                        <label className="text-sm font-semibold">OpenAI API Key</label>
                        {openaiKeyFromEnv ? (
                            <div className="text-sm italic text-green-400">Loaded from environment (hidden)</div>
                        ) : (
                            <>
                                <input
                                    type="password"
                                    value={openaiApiKey}
                                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                                    placeholder="Paste OpenAI API key"
                                    className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm"
                                />
                                <p className="text-xs opacity-70 mt-1">Stored locally; use server proxy for production.</p>
                            </>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Selected Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm"
                        >
                            {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <p className="text-xs opacity-70 mt-1">Used by the main action buttons.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
  );

  const renderDashboard = () => (
      <div className="animate-fadeIn">
          <Dashboard metrics={metrics} />
      </div>
  );

  // --- Main Layout ---
  return (
    <div className="min-h-screen font-sans bg-background text-text selection:bg-accent selection:text-white pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg animate-pulse-slow">
                <BookOpen className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight">FDA 510(k) Review Studio</h1>
                <p className="text-xs opacity-70">Powered by Agentic AI • {THEMES.find(t => t.id === appState.themeId)?.name}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
             <button 
                onClick={handleJackpot}
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold py-1 px-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
             >
                <Wand2 size={16} /> Jackpot Style
             </button>
             <select 
                className="bg-background border border-white/20 rounded px-2 py-1 text-sm"
                value={appState.themeId}
                onChange={(e) => setAppState(p => ({...p, themeId: e.target.value}))}
             >
                 {THEMES.map(t => <option key={t.id} value={t.id}>{t.painter}</option>)}
             </select>
        </div>
      </header>

      {/* Main Content */}
      {/* Sidebar for API keys */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 p-4 bg-surface/95 border-r border-white/10 shadow-lg z-50 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-72'}`}>
          <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">API Keys & Model</h3>
              <button onClick={() => setSidebarOpen(false)} className="text-sm px-2 py-1 bg-white/5 rounded">Hide</button>
          </div>
          <div className="space-y-3">
              <div>
                  <label className="text-xs font-semibold">Gemini API</label>
                  {geminiKeyFromEnv ? (
                      <div className="text-sm italic text-green-400">Loaded from environment (hidden)</div>
                  ) : (
                      <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} placeholder="Paste Gemini API key" className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm" />
                  )}
              </div>

              <div>
                  <label className="text-xs font-semibold">OpenAI API</label>
                  {openaiKeyFromEnv ? (
                      <div className="text-sm italic text-green-400">Loaded from environment (hidden)</div>
                  ) : (
                      <input type="password" value={openaiApiKey} onChange={e => setOpenaiApiKey(e.target.value)} placeholder="Paste OpenAI API key" className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm" />
                  )}
              </div>

              <div>
                  <label className="text-xs font-semibold">Model</label>
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-sm">
                      {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {/* Sidebar toggle when hidden */}
      {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="fixed left-0 top-28 z-50 bg-primary text-white px-2 py-1 rounded-r">Keys</button>
      )}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <StatusHUD state={appState} />

        {/* Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
            {[
                {id: 'summary', label: 'Summary Analysis', icon: FileText},
                {id: 'guidance', label: 'Review Guidance', icon: BookOpen},
                {id: 'submission', label: 'Submission Review', icon: ClipboardList},
                {id: 'notes', label: 'AI Note Keeper', icon: PenTool},
                {id: 'config', label: 'Configuration', icon: Settings},
                {id: 'dashboard', label: 'Dashboard', icon: ActivityIcon},
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-all duration-300
                        ${activeTab === tab.id 
                            ? 'bg-surface text-primary border-t-2 border-primary shadow-[0_-5px_15px_rgba(0,0,0,0.1)] translate-y-[1px]' 
                            : 'bg-surface/30 hover:bg-surface/50 opacity-70 hover:opacity-100'}
                    `}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
        </div>

        {/* Tab Content Area */}
        <div className="min-h-[500px]">
            {activeTab === 'summary' && renderSummaryTab()}
            {activeTab === 'guidance' && renderGuidanceTab()}
            {activeTab === 'submission' && renderSubmissionTab()}
            {activeTab === 'notes' && renderNoteKeeperTab()}
            {activeTab === 'config' && renderConfigTab()}
            {activeTab === 'dashboard' && renderDashboard()}
        </div>

      </main>

    </div>
  );
};

// Helper icon component for Dashboard tab
const ActivityIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default App;