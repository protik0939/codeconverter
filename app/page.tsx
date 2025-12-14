"use client";

import { useEffect, useState, useRef } from "react";

/** Minimal WASM module typing */
type TranspilerModule = {
  ccall: (
    ident: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => string;
};

/** Extend window for Emscripten factory */
declare global {
  interface Window {
    createTranspilerModule?: () => Promise<TranspilerModule>;
  }
}

export default function Home() {
  const moduleRef = useRef<TranspilerModule | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [converting, setConverting] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phpCode, setPhpCode] = useState<string>(`$a = 10;
$b = 20;
if ($a < $b) {
  echo "B is greater";
} else {
  echo "A is greater";
}
`);
  const [jsCode, setJsCode] = useState<string>("");

  useEffect(() => {
    // load WASM JS glue dynamically from /public/wasm
    const script = document.createElement("script");
    script.src = "/wasm/transpiler.js";
    script.async = true;

    script.onload = () => {
      if (!window.createTranspilerModule) {
        console.error("createTranspilerModule not found");
        setLoading(false);
        return;
      }

      window
        .createTranspilerModule()
        .then((mod) => {
          moduleRef.current = mod;
          setLoading(false);
        })
        .catch((err) => {
          console.error("WASM module init failed:", err);
          setLoading(false);
        });
    };

    script.onerror = (e) => {
      console.error("Failed to load transpiler.js", e);
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const runTranspile = () => {
    if (!moduleRef.current) {
      alert("WASM not loaded yet");
      return;
    }

    setConverting(true);
    
    setTimeout(() => {
      try {
        const result = moduleRef.current!.ccall(
          "transpile",
          "string",
          ["string"],
          [phpCode]
        );
        setJsCode(result);
      } catch (err) {
        console.error(err);
        setJsCode("// transpile error");
      } finally {
        setConverting(false);
      }
    }, 300);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsCode);
    showToast("Copied to clipboard!");
  };

  const clearAll = () => {
    setPhpCode("");
    setJsCode("");
    showToast("Cleared all code!");
  };

  const loadSample = () => {
    setPhpCode(sample1);
    showToast("Sample code loaded!");
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-900 flex flex-col">
      {/* Compact Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-700">
        <div className="px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center p-1 flex-shrink-0">
              <img src="/cc.svg" alt="Code Converter" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-white truncate">PHP to JS Converter</h1>
              <p className="text-xs text-purple-300 hidden sm:block">Powered by WebAssembly</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <button
              onClick={loadSample}
              className="px-1.5 sm:px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">Sample</span>
              <img src="/sample.svg" alt="Sample" className="w-4 h-4 sm:hidden brightness-0 invert opacity-80" />
            </button>
            <button
              onClick={clearAll}
              className="px-1.5 sm:px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">Clear</span>
              <img src="/delete.svg" alt="Clear" className="w-4 h-4 sm:hidden brightness-0 invert opacity-80" />
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!jsCode}
              className="px-1.5 sm:px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Copy</span>
              <img src="/copy.svg" alt="Copy" className="w-4 h-4 sm:hidden brightness-0 invert opacity-80" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-1.5 sm:px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all cursor-pointer"
            >
              <img src="/info.svg" alt="Info" className="w-4 h-4 brightness-0 invert opacity-80" />
            </button>
            {loading ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                Loading
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                Ready
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Editor Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
        {/* PHP Input */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700">
          <div className="flex-shrink-0 px-3 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/php.svg" alt="PHP" className="w-8 h-auto" />
              <span className="text-sm font-semibold text-gray-200">PHP Input</span>
            </div>
          </div>
          <textarea
            value={phpCode}
            onChange={(e) => setPhpCode(e.target.value)}
            placeholder="Enter your PHP code here..."
            className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none border-0"
            spellCheck={false}
          />
        </div>

        {/* JavaScript Output */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-gray-800">
          <div className="flex-shrink-0 px-3 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/js.svg" alt="JavaScript" className="w-5 h-auto" />
              <span className="text-sm font-semibold text-gray-200">JavaScript Output</span>
            </div>
          </div>
          <textarea
            value={jsCode}
            readOnly
            placeholder="Your converted JavaScript will appear here..."
            className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none border-0"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Convert Button */}
      <button
        onClick={runTranspile}
        disabled={loading || converting}
        className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto w-full z-50 group px-8 py-4 md:rounded-full rounded-none font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all md:transform md:hover:scale-110 md:active:scale-95 cursor-pointer"
      >
        <span className="flex items-center gap-3">
          {converting ? (
            <>
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Convert
            </>
          )}        </span>
      </button>

      {/* Team Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-4 flex items-center justify-between border-b border-purple-700">
              <h2 className="text-xl font-bold text-white">Made By</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-purple-200 hover:text-white hover:bg-purple-800 rounded-full p-2 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Team Member 1 */}
                <div className="flex flex-col items-center text-center space-y-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                    A
                  </div>
                  <h3 className="text-white font-semibold">Team Member 1</h3>
                </div>
                {/* Team Member 2 */}
                <div className="flex flex-col items-center text-center space-y-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                    B
                  </div>
                  <h3 className="text-white font-semibold">Team Member 2</h3>
                </div>
                {/* Team Member 3 */}
                <div className="flex flex-col items-center text-center space-y-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                    C
                  </div>
                  <h3 className="text-white font-semibold">Team Member 3</h3>
                </div>
                {/* Team Member 4 */}
                <div className="flex flex-col items-center text-center space-y-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                    D
                  </div>
                  <h3 className="text-white font-semibold">Team Member 4</h3>
                </div>
                {/* Team Member 5 */}
                <div className="flex flex-col items-center text-center space-y-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                    E
                  </div>
                  <h3 className="text-white font-semibold">Team Member 5</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

const sample1 = `$a = 1;
$b = 2;
$c = $a + $b * 10;
echo $c;
while ($a < 5) {
  echo $a;
  $a = $a + 1;
}
`;
