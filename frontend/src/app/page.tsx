"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

interface Source {
  title: string;
  source: string;
  content_preview: string;
}

const exampleQuestions: Record<string, string[]> = {
  general: ["What is machine learning?", "Explain quantum computing like I'm 5.", "How does a vector database work?"],
  medical: ["I am facing coughing and fever, suggest medicine", "What are the side effects of Ibuprofen?", "Explain my blood test results."],
  legal: ["Give me a bail template.", "What is a non-disclosure agreement?", "Explain the Fair Use doctrine."]
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("general");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === "dark";

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (error) {
      console.error(error);
      setAnswer("An error occurred while fetching the answer.");
    } finally {
      setLoading(false);
    }
  };

  const downloadAsTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([answer], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "TrilogyRAG_Document.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(answer, 180);
    doc.text(splitText, 15, 20);
    doc.save("TrilogyRAG_Document.pdf");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      
      setUploadMessage(`✅ Successfully added ${file.name} to knowledge base.`);
    } catch (error: any) {
      console.error(error);
      setUploadMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 font-sans ${isDark ? "bg-neutral-950 text-neutral-100" : "bg-emerald-50 text-emerald-950"}`}>
      
      {/* Background Decorative Mesh / Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40 mix-blend-multiply transition-colors duration-1000 ${isDark ? 'bg-indigo-900/40' : 'bg-emerald-200/60'}`}></div>
        <div className={`absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-30 mix-blend-multiply transition-colors duration-1000 ${isDark ? 'bg-emerald-800/40' : 'bg-teal-200/50'}`}></div>
        <div className={`absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-30 mix-blend-multiply transition-colors duration-1000 ${isDark ? 'bg-purple-900/30' : 'bg-green-100/60'}`}></div>
      </div>

      <div className="relative z-10 p-6 md:p-12 min-h-screen flex flex-col items-center justify-center">
        
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 flex items-center justify-center border ${
              isDark 
                ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" 
                : "bg-white/50 border-emerald-200 text-emerald-600 hover:bg-white/80"
            }`}
            title="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" fillRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            )}
          </button>
        </div>

        <main className="w-full max-w-4xl space-y-12 animate-fade-in-up mt-12 md:mt-0">
          
          {/* Header */}
          <header className="text-center space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md mb-2 animate-pulse-slow">
              <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Next-Gen RAG Architecture</span>
            </div>
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter drop-shadow-sm ${isDark ? "text-white" : "text-emerald-950"}`}>
              TrilogyRAG<span className="hidden md:inline">:</span> <br className="md:hidden" />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Domain Expert AI</span>
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium ${isDark ? "text-neutral-400" : "text-emerald-800/70"}`}>
              Upload your documents and interact with a specialized neural engine tailored for Legal, Medical, or General analysis.
            </p>
          </header>

          {/* Glassmorphic Control Panel */}
          <div className={`backdrop-blur-xl border rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 justify-between transition-all duration-500 hover:shadow-emerald-500/10 ${
            isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white"
          }`}>
            
            {/* Mode Selection */}
            <div className="flex-1 w-full space-y-3">
              <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-neutral-500" : "text-emerald-500/80"}`}>Select Persona</label>
              <div className="flex gap-2 bg-black/5 p-1 rounded-2xl">
                {['general', 'medical', 'legal'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 capitalize py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                      mode === m 
                        ? (isDark 
                            ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                            : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-100")
                        : (isDark 
                            ? "text-neutral-400 hover:text-white hover:bg-white/5" 
                            : "text-emerald-700 hover:bg-white scale-95 hover:scale-100")
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className={`w-px h-20 hidden md:block ${isDark ? "bg-white/10" : "bg-emerald-900/10"}`}></div>

            {/* Document Upload */}
            <div className="flex-1 w-full space-y-3">
              <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-neutral-500" : "text-emerald-500/80"}`}>Knowledge Base</label>
              <div className="relative group">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.txt,.md,.csv" 
                  onChange={handleFileUpload} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 border-2 overflow-hidden relative ${
                    isDark 
                      ? "bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400" 
                      : "bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:shadow-lg shadow-emerald-500/10"
                  }`}
                >
                  <svg className="w-5 h-5 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="z-10">{uploading ? "Ingesting Data..." : "Upload Document"}</span>
                </button>
                {uploadMessage && (
                  <p className={`absolute -bottom-6 left-0 right-0 text-xs text-center font-medium animate-fade-in ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    {uploadMessage}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Epic Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto group z-20">
            <div className={`absolute -inset-1 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${
              isDark ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-emerald-400 to-green-300"
            }`}></div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={`Ask a ${mode} question...`}
                rows={1}
                className={`w-full backdrop-blur-xl border rounded-[2rem] py-5 pl-8 pr-36 text-lg font-medium focus:outline-none transition-all duration-300 shadow-2xl resize-none overflow-hidden ${
                  isDark 
                    ? "bg-neutral-900/80 border-white/10 text-white placeholder-neutral-500 focus:border-emerald-500/50" 
                    : "bg-white/80 border-white text-emerald-950 placeholder-emerald-400 focus:border-emerald-300"
                }`}
              />
              <button
                type="submit"
                disabled={loading}
                className={`absolute right-2 top-2 bottom-2 px-8 rounded-full font-bold tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDark 
                    ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                    : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Synthesizing
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
            {/* Example Questions */}
            <div className="flex flex-wrap gap-2 justify-center mt-4 animate-fade-in-up">
              <span className={`text-sm font-medium my-auto mr-2 ${isDark ? "text-neutral-400" : "text-emerald-700/60"}`}>Try asking:</span>
              {exampleQuestions[mode]?.map((q) => (
                <button 
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    isDark 
                      ? "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300" 
                      : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-700 hover:shadow-sm"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </form>

          {/* Results Area */}
          {answer && (
            <div className={`backdrop-blur-2xl border rounded-[2rem] p-8 md:p-10 shadow-2xl animate-fade-in-up space-y-8 relative overflow-hidden ${
              isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-white shadow-emerald-900/5"
            }`}>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                    <div className={`p-2 rounded-lg ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Synthesis Complete
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={downloadAsTxt} className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${isDark ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"}`}>
                      ↓ TXT
                    </button>
                    <button onClick={downloadAsPdf} className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${isDark ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"}`}>
                      ↓ PDF
                    </button>
                  </div>
                </div>
                <div className={`prose max-w-none leading-relaxed text-lg font-medium ${isDark ? "prose-invert text-neutral-300" : "text-emerald-950/80"}`}>
                  {answer.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                  ))}
                </div>
              </div>

              {sources.length > 0 && (
                <div className={`relative z-10 border-t pt-8 mt-8 ${isDark ? "border-white/10" : "border-emerald-900/10"}`}>
                  <h3 className={`text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2 ${isDark ? "text-neutral-500" : "text-emerald-500/80"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Extracted Sources
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {sources.map((src, i) => (
                      <div key={i} className={`border rounded-2xl p-5 transition-all duration-300 cursor-pointer group ${
                        isDark 
                          ? "bg-white/5 border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5" 
                          : "bg-white/50 border-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5"
                      }`}>
                        <h4 className={`font-bold text-base transition-colors line-clamp-1 mb-1 ${
                          isDark ? "text-neutral-200 group-hover:text-emerald-400" : "text-emerald-900 group-hover:text-emerald-600"
                        }`}>
                          {src.title}
                        </h4>
                        <p className={`text-xs font-mono break-all mb-3 px-2 py-1 inline-block rounded-md ${
                          isDark ? "bg-black/50 text-neutral-400" : "bg-emerald-50 text-emerald-600/80"
                        }`}>
                          {src.source}
                        </p>
                        <p className={`text-sm line-clamp-2 leading-relaxed ${isDark ? "text-neutral-400" : "text-emerald-800/70"}`}>
                          "{src.content_preview}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
}
