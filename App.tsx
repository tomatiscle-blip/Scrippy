
import React, { useState, useRef, useMemo } from 'react';
import { processContent } from './services/gemini';
import { ReaderAction, HistoryItem, BeamSchema } from './types';

const Navbar = () => (
  <nav className="bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">
          Structural<span className="text-emerald-400">Draw</span>
        </h1>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Cálculo y Detallado Gráfico</span>
      </div>
    </div>
  </nav>
);

const BeamVisualizer: React.FC<{ data: BeamSchema }> = ({ data }) => {
  const padding = 40;
  const scale = useMemo(() => {
    const maxDim = Math.max(data.length, data.height * 10); // Scale logic
    return 600 / maxDim;
  }, [data]);

  const beamW = data.length * scale;
  const beamH = data.height * 4 * scale; // Exaggerate height for visibility

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col items-center">
      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 self-start">Esquema Longitudinal de Armadura</h3>
      <svg width={beamW + padding * 2} height={beamH + padding * 2} viewBox={`0 0 ${beamW + padding * 2} ${beamH + padding * 2}`}>
        {/* Beam Outline */}
        <rect 
          x={padding} 
          y={padding} 
          width={beamW} 
          height={beamH} 
          fill="rgba(100, 116, 139, 0.1)" 
          stroke="#475569" 
          strokeWidth="2"
        />
        
        {/* Reinforcement Bars (Lines) */}
        {data.bars.map((bar, idx) => (
          <g key={bar.id || idx}>
            <polyline
              points={bar.points.map(p => `${padding + p.x * scale}, ${padding + p.y * scale}`).join(' ')}
              fill="none"
              stroke={bar.color || "#fbbf24"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {bar.label && (
              <text 
                x={padding + bar.points[0].x * scale} 
                y={padding + bar.points[0].y * scale - 10} 
                fill={bar.color || "#fbbf24"} 
                fontSize="10" 
                fontWeight="bold"
                className="font-mono"
              >
                {bar.label}
              </text>
            )}
          </g>
        ))}

        {/* Dimension Lines */}
        <text x={padding + beamW/2} y={padding + beamH + 25} fill="#64748b" fontSize="10" textAnchor="middle">L = {data.length} cm</text>
        <text x={padding - 10} y={padding + beamH/2} fill="#64748b" fontSize="10" textAnchor="middle" transform={`rotate(-90, ${padding - 10}, ${padding + beamH/2})`}>H = {data.height} cm</text>
      </svg>
      <p className="mt-4 text-[9px] text-slate-500 italic uppercase">Dibujo técnico generado automáticamente • Escala adaptativa</p>
    </div>
  );
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<ReaderAction>(ReaderAction.DIBUJAR_ARMADO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [drawingData, setDrawingData] = useState<BeamSchema | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!inputText) {
      setError('Pegá tu estructura de datos (JSON) para dimensionar.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setDrawingData(null);
    try {
      const response = await processContent(inputText, selectedAction, customPrompt);
      setResult(response);
      
      // Extract Drawing Data
      const drawingMatch = response.match(/\[DRAWING_DATA\]\s*(\{[\s\S]*?\})/);
      if (drawingMatch) {
        try {
          const parsed = JSON.parse(drawingMatch[1]);
          setDrawingData(parsed);
        } catch (e) {
          console.error("Error parsing drawing JSON", e);
        }
      }

      setHistory(prev => [{
        id: Date.now().toString(),
        input: inputText.substring(0, 30),
        output: response,
        action: selectedAction,
        date: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 5));
    } catch (err) {
      setError('Error en el proceso. Revisá el formato de tus datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    const codeRegex = /```python([\s\S]*?)```/g;
    const match = codeRegex.exec(result);
    const content = match ? match[1].trim() : result;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viga_completa.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-300 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Entrada */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-md">
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Estructura de Datos
            </h2>
            <textarea
              className="w-full h-80 p-5 bg-black/60 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-mono text-[10px] leading-relaxed transition-all mb-4 scrollbar-hide"
              placeholder='[ { "id": "V1", "L": 500, "b": 20, "h": 40, "Mu_tramo": 35, "Tu": 8 }, ... ]'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="space-y-2 mb-6">
              {Object.values(ReaderAction).map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedAction(a)}
                  className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black text-left transition-all border uppercase tracking-wider ${
                    selectedAction === a 
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' 
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-2xl tracking-widest uppercase text-xs ${
                isProcessing ? 'bg-emerald-800 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95'
              }`}
            >
              {isProcessing ? "PROCESANDO..." : "CALCULAR Y DIBUJAR"}
            </button>
            {error && <p className="mt-3 text-[10px] text-red-500 text-center font-bold uppercase">{error}</p>}
          </div>
        </div>

        {/* Salida Gráfica y Código */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Visualizador de Barras */}
          {drawingData && (
            <BeamVisualizer data={drawingData} />
          )}

          {/* Consola de Código */}
          <div className="bg-black border border-slate-800 rounded-3xl shadow-2xl flex flex-col min-h-[500px] overflow-hidden">
            <div className="bg-slate-900/80 px-6 py-3 flex justify-between items-center border-b border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Script & Reporte Estructural</span>
              {result && (
                <button onClick={downloadFile} className="text-[9px] font-black text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 uppercase transition-all">
                  Descargar .py
                </button>
              )}
            </div>
            
            <div className="p-6 flex-1 overflow-auto font-mono text-[10px] leading-relaxed">
              {result ? (
                <div className="text-slate-400">
                  {result.replace(/\[DRAWING_DATA\][\s\S]*$/, '').split('```').map((part, i) => (
                    i % 2 === 1 ? (
                      <div key={i} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 my-4 text-emerald-300">
                        {part.replace('python', '').trim()}
                      </div>
                    ) : <span key={i} className="text-slate-500 whitespace-pre-wrap">{part}</span>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <p className="text-lg font-black uppercase tracking-[0.3em]">Carga Datos para Visualizar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 px-8 border-t border-slate-900 bg-[#020617] flex justify-between items-center text-slate-600">
        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Structural Engine • Vectorial Drawing System</span>
        <span className="text-[8px] font-bold uppercase tracking-widest">v5.2 CAD-Ready</span>
      </footer>
    </div>
  );
};

export default App;
