import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Languages, Keyboard, Info, Upload, Eraser, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { questions as defaultQuestions, Question } from './data';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [customQuestions, setCustomQuestions] = useState<Question[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal States
  const [hasExplanation, setHasExplanation] = useState(true);
  const [hasSpanish, setHasSpanish] = useState(true);
  const [englishFile, setEnglishFile] = useState<File | null>(null);
  const [spanishFile, setSpanishFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeQuestions = customQuestions || defaultQuestions;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      
      if (isCmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setLanguage('en');
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setLanguage('es');
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isFiltered = searchQuery.trim().length > 0;

  const normalizeText = (text: string) => 
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredQuestions = useMemo(() => {
    if (!isFiltered) return activeQuestions;
    const query = normalizeText(searchQuery);
    
    return activeQuestions.filter((q) => {
      const enMatch = 
        normalizeText(q.en.pregunta).includes(query) ||
        normalizeText(q.en.respuesta).includes(query) ||
        normalizeText(q.en.explicacion).includes(query);
      
      const esMatch = q.es ? (
        normalizeText(q.es.pregunta).includes(query) ||
        normalizeText(q.es.respuesta).includes(query) ||
        normalizeText(q.es.explicacion).includes(query)
      ) : false;

      return enMatch || esMatch;
    });
  }, [searchQuery, activeQuestions]);

  const parseFile = async (file: File, useExplanation: boolean) => {
    const text = await file.text();
    // Split by the pattern but keep the pattern in the resulting blocks
    const blocks = text.split(/(?=\b\d+\.\s*Pregunta:)/g).filter(b => b.trim().length > 0);
    const parsed = blocks.map(block => {
      const idMatch = block.trim().match(/^(\d+)\./);
      const questionMatch = block.match(/Pregunta:\s*(.*)/);
      const answerMatch = block.match(/Respuesta:\s*(.*)/);
      const explanationMatch = block.match(/Explicación:\s*([\s\S]*)/);

      if (!idMatch || !questionMatch || !answerMatch) return null;

      return {
        id: parseInt(idMatch[1]),
        pregunta: questionMatch[1].trim(),
        respuesta: answerMatch[1].trim(),
        explicacion: useExplanation && explanationMatch ? explanationMatch[1].trim() : ""
      };
    }).filter(q => q !== null);

    return parsed;
  };

  const handleUpload = async () => {
    setError(null);
    if (!englishFile) {
      setError("English file is mandatory.");
      return;
    }
    if (hasSpanish && !spanishFile) {
      setError("Spanish file is enabled but not selected.");
      return;
    }

    try {
      const enData = await parseFile(englishFile, hasExplanation);
      let esData: any[] = [];
      
      if (hasSpanish && spanishFile) {
        esData = await parseFile(spanishFile, hasExplanation);
      }

      if (enData.length === 0) {
        throw new Error("No valid questions found in English file.");
      }

      const combined: Question[] = enData.map((enQ, index) => {
        const esQ = esData.find(q => q.id === enQ.id) || esData[index];
        return {
          id: enQ.id,
          en: {
            pregunta: enQ.pregunta,
            respuesta: enQ.respuesta,
            explicacion: enQ.explicacion
          },
          es: hasSpanish && esQ ? {
            pregunta: esQ.pregunta,
            respuesta: esQ.respuesta,
            explicacion: esQ.explicacion
          } : {
            pregunta: enQ.pregunta,
            respuesta: enQ.respuesta,
            explicacion: enQ.explicacion
          }
        };
      });

      setCustomQuestions(combined);
      setSearchQuery('');
      setIsModalOpen(false);
      setEnglishFile(null);
      setSpanishFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error parsing files.");
    }
  };

  const handleReset = () => {
    setCustomQuestions(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Dynamic Title */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white transition-all duration-500">
              {language === 'en' ? "Search for question reagents" : "Usalo con sabiduría"}
            </h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* Search Bar & Toggle Container */}
            <div className="w-full max-w-4xl flex flex-col md:flex-row items-stretch gap-4">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={language === 'en' ? "Search concept... (CMD+P)" : "Buscar concepto... (CMD+P)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141414] border-2 border-gray-800 rounded-2xl py-4 pl-12 pr-4 w-full focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all text-lg shadow-2xl placeholder:text-gray-600"
                />
              </div>

              <div className="flex gap-3">
                {/* LOAD Button (Only if no custom data) */}
                {!customQuestions && (
                  <button 
                    onClick={() => {
                      setIsModalOpen(true);
                      setSearchQuery('');
                    }}
                    className="flex flex-col items-center justify-center px-6 py-2 rounded-2xl border-2 border-purple-900 bg-purple-950/30 text-purple-400 hover:bg-purple-900/40 hover:border-purple-600 transition-all duration-300 min-w-[100px]"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">LOAD</span>
                  </button>
                )}

                {/* Single Toggle Button */}
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                  className={`flex flex-col items-center justify-center px-6 py-2 rounded-2xl border-2 transition-all duration-500 min-w-[140px] group relative overflow-hidden ${
                    language === 'es' 
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40' 
                      : 'bg-[#141414] border-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Languages className={`w-4 h-4 transition-transform duration-500 ${language === 'es' ? 'rotate-180' : ''}`} />
                    <span className="text-sm font-black uppercase tracking-tight">
                      {language === 'en' ? 'English' : 'Español'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold opacity-60 mt-0.5 ${language === 'es' ? 'text-red-100' : 'text-gray-500'}`}>
                    {language === 'en' ? 'CMD + E' : 'CMD + S'}
                  </span>
                </button>

                {/* CLEAR Button (Only if custom data is loaded) */}
                {customQuestions && (
                  <button 
                    onClick={handleReset}
                    className="flex flex-col items-center justify-center px-6 py-2 rounded-2xl border-2 border-orange-900 bg-orange-950/30 text-orange-400 hover:bg-orange-900/40 hover:border-orange-600 transition-all duration-300 min-w-[100px]"
                  >
                    <Eraser className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">CLEAR</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Questions List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((q) => {
              const content = q[language] || q.en;
              return (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-xl overflow-hidden border border-gray-800 bg-[#111] shadow-xl"
                >
                  {/* Question Row */}
                  <div 
                    className={`p-5 transition-colors duration-300 ${
                      isFiltered ? 'bg-[#450a0a] text-white' : 'bg-[#1a1a1a] text-gray-200'
                    }`}
                  >
                    <div className="flex gap-4">
                      <span className="text-sm font-mono opacity-50 shrink-0">#{q.id.toString().padStart(2, '0')}</span>
                      <h2 className="text-lg font-medium leading-tight">
                        {content.pregunta}
                      </h2>
                    </div>
                  </div>

                  {/* Answer & Explanation */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                        {language === 'en' ? 'Answer' : 'Respuesta'}
                      </p>
                      <div 
                        className={`p-3 rounded-lg transition-colors duration-300 ${
                          isFiltered ? 'bg-[#172554] text-blue-100 border border-blue-900/50' : 'bg-transparent text-gray-300'
                        }`}
                      >
                        <p className="text-base leading-relaxed">
                          {content.respuesta}
                        </p>
                      </div>
                    </div>

                    {content.explicacion && (
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                          {language === 'en' ? 'Explanation' : 'Explicación'}
                        </p>
                        <div 
                          className={`p-3 rounded-lg transition-colors duration-300 ${
                            isFiltered ? 'bg-[#064e3b] text-green-100 border border-green-900/50' : 'bg-transparent text-gray-400 italic'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {content.explicacion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <p className="text-gray-500">
                {language === 'en' 
                  ? "No matches found for your search." 
                  : "No se encontraron coincidencias para tu búsqueda."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <Upload className="w-6 h-6 text-purple-500" />
                  <h2 className="text-xl font-bold">Load Custom Reagents</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" /> Instructions
                  </h3>
                  <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 text-sm text-gray-400 space-y-2 leading-relaxed">
                    <p>1. Prepare your files in <span className="text-white font-mono">.txt</span> format.</p>
                    <p>2. Each question must follow this exact structure:</p>
                    <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-gray-300 border border-gray-800/50">
                      1. Pregunta: [Your question]<br/>
                      Respuesta: [Your answer]<br/>
                      Explicación: [Optional details]
                    </div>
                    <p>3. Ensure the question number and <span className="text-white">Pregunta:</span> prefix are present.</p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-gray-800 cursor-pointer hover:border-purple-500/50 transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={hasExplanation} 
                      onChange={(e) => setHasExplanation(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-700 bg-black text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200">Has Explanation</span>
                      <span className="text-[10px] text-gray-500">Enable parsing of "Explicación" field</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-gray-800 cursor-pointer hover:border-purple-500/50 transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={hasSpanish} 
                      onChange={(e) => setHasSpanish(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-700 bg-black text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200">Enable Spanish</span>
                      <span className="text-[10px] text-gray-500">Upload a second file for translation</span>
                    </div>
                  </label>
                </div>

                {/* File Selectors */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">English File (Mandatory)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".txt"
                        onChange={(e) => setEnglishFile(e.target.files?.[0] || null)}
                        className="hidden" 
                        id="en-file"
                      />
                      <label 
                        htmlFor="en-file"
                        className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                          englishFile ? 'border-purple-500 bg-purple-500/5' : 'border-gray-800 bg-black/20 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${englishFile ? 'text-purple-500' : 'text-gray-600'}`} />
                          <span className={`text-sm ${englishFile ? 'text-gray-200' : 'text-gray-500'}`}>
                            {englishFile ? englishFile.name : "Select ingles.txt"}
                          </span>
                        </div>
                        {englishFile && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                      </label>
                    </div>
                  </div>

                  {hasSpanish && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spanish File</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept=".txt"
                          onChange={(e) => setSpanishFile(e.target.files?.[0] || null)}
                          className="hidden" 
                          id="es-file"
                        />
                        <label 
                          htmlFor="es-file"
                          className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                            spanishFile ? 'border-purple-500 bg-purple-500/5' : 'border-gray-800 bg-black/20 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${spanishFile ? 'text-purple-500' : 'text-gray-600'}`} />
                            <span className={`text-sm ${spanishFile ? 'text-gray-200' : 'text-gray-500'}`}>
                              {spanishFile ? spanishFile.name : "Select español.txt"}
                            </span>
                          </div>
                          {spanishFile && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#1a1a1a] border-t border-gray-800 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-800 text-gray-400 font-bold hover:bg-gray-800 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleUpload}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-all"
                >
                  LOAD DATA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-600">
         🌐 Developed by Max Moreno - AI Reactivos • Abril 2026
        </p>
      </footer>
    </div>
  );
}
