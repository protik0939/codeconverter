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
  };

  const clearAll = () => {
    setPhpCode("");
    setJsCode("");
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-900 flex flex-col">
      {/* Compact Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-700">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">UniTrans</h1>
              <p className="text-xs text-purple-300 hidden sm:block">PHP to JavaScript Transpiler</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhpCode(sample1)}
              className="px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all"
            >
              Sample
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all"
            >
              Clear
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!jsCode}
              className="px-2 py-1 text-xs font-medium text-purple-200 hover:text-white hover:bg-purple-800 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* PHP Input */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700">
          <div className="flex-shrink-0 px-3 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🐘</span>
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
              <span className="text-base">⚡</span>
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

      {/* Floating Convert Button */}
      <button
        onClick={runTranspile}
        disabled={loading || converting}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 group px-8 py-4 rounded-full font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
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
          )}
        </span>
      </button>
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
