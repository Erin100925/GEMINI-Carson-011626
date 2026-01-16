import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Theme, Agent, Metrics, AVAILABLE_MODELS } from './types';
import { THEMES, DEFAULT_AGENTS, INITIAL_YAML, INITIAL_SKILL_MD } from './constants';
import StatusHUD from './components/StatusHUD';
import Dashboard from './components/Dashboard';
import { callGemini } from './services/geminiService';
import { Layout, FileText, Settings, BookOpen, PenTool, ClipboardList, Wand2, Upload, Download, Play, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  const [ocrInput, setOcrInput] = useState(''); // Text content extracted from PDF
  const [ocrOutput, setOcrOutput] = useState(''); // Summary/Analysis
  const [ocrAgentId, setOcrAgentId] = useState(agents[0].id);

  const [noteInput, setNoteInput] = useState('');
  const [noteOutput, setNoteOutput] = useState('');
  const [noteKeywords, setNoteKeywords] = useState('');

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
    setLoading(true);
    const start = Date.now();
    try {
      const result = await callGemini(
        model,
        prompt,
        userContent,
        0.5,
        config.maxTokens || 4000
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
                            "gemini-2.5-flash", 
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
        <textarea 
            className="w-full h-32 p-3 rounded-lg bg-background/50 border border-white/10 mb-4"
            value={guidanceInput}
            onChange={(e) => setGuidanceInput(e.target.value)}
            placeholder="Paste guidance text or instructions..."
        />
        <button 
            onClick={() => handleRunAI(
                "Create a comprehensive review guideline with a checklist based on the provided text.", 
                guidanceInput, 
                "gemini-3-flash-preview", 
                setGuidanceOutput
            )}
            className="bg-accent text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:brightness-110 mb-4"
        >
            Generate Checklist
        </button>
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
                        <input type="file" className="opacity-0 absolute inset-0 cursor-pointer" accept=".pdf" onChange={(e) => handleFileUpload(e, setOcrInput)} />
                    </div>
                    {ocrInput && (
                        <div className="bg-white text-black p-4 rounded h-64 overflow-y-auto text-xs font-mono">
                            <p className="text-gray-500 italic mb-2">-- Simulated OCR Preview (Page 1-5) --</p>
                            {ocrInput}
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
                        <span className="text-sm font-bold whitespace-nowrap">Agent:</span>
                        <select 
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm flex-1"
                            value={ocrAgentId}
                            onChange={(e) => setOcrAgentId(e.target.value)}
                        >
                            {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.model})</option>)}
                        </select>
                        <button 
                            onClick={() => {
                                const agent = agents.find(a => a.id === ocrAgentId);
                                if (agent) {
                                    handleRunAI(agent.systemPrompt, ocrInput, agent.model, setOcrOutput, { maxTokens: agent.maxTokens });
                                }
                            }}
                            className="bg-secondary text-white px-4 py-1 rounded shadow hover:brightness-110"
                        >
                            Execute Agent
                        </button>
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
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button 
                            onClick={() => handleRunAI(
                                `Organize these notes into structured markdown. Highlight these keywords in coral color using HTML span style: ${noteKeywords}`, 
                                noteInput, "gemini-2.5-flash", setNoteOutput
                            )}
                            className="bg-primary/80 hover:bg-primary p-2 rounded text-xs flex items-center justify-center gap-1"
                        >
                            <Wand2 size={12}/> Organize & Highlight
                        </button>
                        <button 
                             onClick={() => handleRunAI(
                                `Extract action items and format as a checklist.`, 
                                noteInput, "gemini-2.5-flash", setNoteOutput
                            )}
                            className="bg-secondary/80 hover:bg-secondary p-2 rounded text-xs flex items-center justify-center gap-1"
                        >
                            <ClipboardList size={12}/> Action Items
                        </button>
                        <button 
                             onClick={() => handleRunAI(
                                `Explain technical terms found in the notes in a glossary format.`, 
                                noteInput, "gemini-3-flash-preview", setNoteOutput
                            )}
                            className="bg-accent/80 hover:bg-accent p-2 rounded text-xs flex items-center justify-center gap-1"
                        >
                            <BookOpen size={12}/> Glossary
                        </button>
                        <button 
                             onClick={() => handleRunAI(
                                `Rewrite these notes to be more professional and concise for an FDA report.`, 
                                noteInput, "gemini-2.5-flash-lite", setNoteOutput
                            )}
                            className="bg-green-600/80 hover:bg-green-600 p-2 rounded text-xs flex items-center justify-center gap-1"
                        >
                            <PenTool size={12}/> Polish
                        </button>
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