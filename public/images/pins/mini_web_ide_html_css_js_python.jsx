import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FolderOpen, Play, Trash2, Save, TerminalSquare, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

// Helper: download text as a file
function download(filename, text) {
  const el = document.createElement("a");
  el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  el.setAttribute("download", filename);
  el.style.display = "none";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}

// Minimal in-memory file system
const defaultFiles = {
  "index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Mini IDE App</title>
    <link rel=\"stylesheet\" href=\"styles.css\" />
  </head>
  <body>
    <div id=\"app\">Hello from HTML 👋</div>
    <script src=\"app.js\"></script>
  </body>
</html>`,
  "styles.css": `:root { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
body { margin: 0; padding: 2rem; }
#app { padding: 1rem; border: 2px dashed #aaa; border-radius: 1rem; }
button.demo { padding: .6rem 1rem; border-radius: .8rem; border: none; }
`,
  "app.js": `const app = document.getElementById('app');
app.innerHTML = 'Hello from <strong>JavaScript</strong>!';
console.log('JS is running!');
`,
  "main.py": `# Python demo (runs in-browser with Pyodide)\nprint('Hello from Python 🐍')\nfor i in range(3):\n    print('Line', i+1)\n`,
};

export default function MiniIDE() {
  const [files, setFiles] = useState(defaultFiles);
  const [activeFile, setActiveFile] = useState("index.html");
  const [language, setLanguage] = useState("html");
  const [consoleOut, setConsoleOut] = useState("");
  const [pyStatus, setPyStatus] = useState("idle");
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const pyodideRef = useRef(null);

  // Detect language based on filename
  useEffect(() => {
    if (activeFile.endsWith(".html")) setLanguage("html");
    else if (activeFile.endsWith(".css")) setLanguage("css");
    else if (activeFile.endsWith(".js")) setLanguage("javascript");
    else if (activeFile.endsWith(".py")) setLanguage("python");
  }, [activeFile]);

  // Listen for messages from iframe and Pyodide (console)
  useEffect(() => {
    function handleMessage(e) {
      try {
        const data = e.data;
        if (typeof data === "string" && data.startsWith("__IDE_CONSOLE__")) {
          setConsoleOut((prev) => prev + data.replace("__IDE_CONSOLE__", "") + "\n");
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function setFileContent(name, content) {
    setFiles((prev) => ({ ...prev, [name]: content }));
  }

  function addFile() {
    const base = prompt("New file name (e.g. new.js, notes.md, utils.py)");
    if (!base) return;
    if (files[base]) return alert("File already exists.");
    setFiles({ ...files, [base]: "" });
    setActiveFile(base);
  }

  function deleteFile(name) {
    if (!confirm(`Delete ${name}?`)) return;
    const { [name]: _, ...rest } = files;
    setFiles(rest);
    const remaining = Object.keys(rest);
    if (remaining.length) setActiveFile(remaining[0]);
  }

  // Bundle HTML/CSS/JS into a previewable document
  const srcDoc = useMemo(() => {
    const html = files["index.html"] ?? "";
    const css = files["styles.css"] ?? "";
    const js = files["app.js"] ?? "";
    const script = `\n<script>\n  (function(){\n    const oldLog = console.log;\n    console.log = function(){\n      const msg = Array.from(arguments).map(a=>typeof a==='object'? JSON.stringify(a): String(a)).join(' ');\n      parent.postMessage('__IDE_CONSOLE__'+msg, '*');\n      oldLog.apply(console, arguments);\n    };\n  })();\n<\/script>\n<script>\n${js}\n<\/script>`;
    const style = `<style>${css}</style>`;

    // If the HTML already references styles.css or app.js, we still inject to keep it simple.
    const stitched = html.replace(/<\/?html[^>]*>/gi, "").replace(/<\/?body[^>]*>/gi, "");

    return `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>${style}</head><body>${stitched}${script}</body></html>`;
  }, [files]);

  function runWeb() {
    setConsoleOut("");
    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
  }

  // ----- Pyodide (Python in browser) -----
  async function ensurePyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    setPyStatus("loading");

    const moduleUrl = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs";
    const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

    // Try dynamic module import first. The special comment /* @vite-ignore */
    // prevents bundlers like Vite from rewriting the URL into a package URL
    // (which caused the earlier malformed URL). If that fails, fall back to
    // loading the non-module script which provides window.loadPyodide.
    try {
      const { loadPyodide } = await import(/* @vite-ignore */ moduleUrl);
      const pyodide = await loadPyodide({ indexURL });

      // Redirect Python stdout/stderr -> our app via window.postMessage
      await pyodide.runPythonAsync(`
import sys
from js import window
class _C:
    def write(self, s):
        try:
            window.postMessage('__IDE_CONSOLE__' + str(s), '*')
        except Exception:
            pass
    def flush(self):
        pass
sys.stdout = _C()
sys.stderr = _C()
`);

      pyodideRef.current = pyodide;
      setPyStatus("ready");
      return pyodide;
    } catch (err) {
      console.warn("Module import failed, trying script fallback:", err);
    }

    // Fallback: load pyodide.js (non-module) which sets window.loadPyodide
    try {
      await new Promise((resolve, reject) => {
        if (window.loadPyodide) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });

      const pyodide = await window.loadPyodide({ indexURL });
      await pyodide.runPythonAsync(`
import sys
from js import window
class _C:
    def write(self, s):
        try:
            window.postMessage('__IDE_CONSOLE__' + str(s), '*')
        except Exception:
            pass
    def flush(self):
        pass
sys.stdout = _C()
sys.stderr = _C()
`);

      pyodideRef.current = pyodide;
      setPyStatus("ready");
      return pyodide;
    } catch (err2) {
      console.error("Failed to load Pyodide (module + script attempts):", err2);
      setPyStatus("error");
      throw err2;
    }
  }

  async function runPython() {
    setConsoleOut("");
    try {
      const py = await ensurePyodide();
      // Run the currently active .py file if one is active, otherwise run main.py
      const code = activeFile.endsWith(".py") ? files[activeFile] : (files["main.py"] ?? "print('Nothing to run: add main.py')");
      await py.runPythonAsync(code);
    } catch (e) {
      setConsoleOut((prev) => prev + String(e) + "\n");
    }
  }

  // Convenience test that runs a tiny snippet to verify Pyodide is working.
  async function testPyodide() {
    setConsoleOut("");
    try {
      const py = await ensurePyodide();
      await py.runPythonAsync(`print('pyodide-test')`);
    } catch (e) {
      setConsoleOut((prev) => prev + String(e) + "\n");
    }
  }

  function saveProject() {
    const blob = JSON.stringify(files, null, 2);
    download("mini-ide-project.json", blob);
  }

  function exportHTML() {
    download("export.html", srcDoc);
  }

  function loadProjectFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        if (typeof obj === "object" && obj) {
          setFiles(obj);
          const first = Object.keys(obj)[0];
          if (first) setActiveFile(first);
        }
      } catch (e) {
        alert("Invalid project file");
      }
    };
    reader.readAsText(file);
  }

  const fileList = Object.keys(files);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="rounded-2xl px-3 py-1 text-sm">Mini IDE</Badge>
              <span className="text-slate-600">HTML/CSS/JS + Python (Pyodide)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><FolderOpen className="mr-2 h-4 w-4"/>Open</Button>
              <Input type="file" className="hidden" ref={fileInputRef} onChange={(e)=>{
                const f = e.target.files?.[0];
                if (f) loadProjectFromFile(f);
              }} />
              <Button variant="secondary" onClick={saveProject}><Save className="mr-2 h-4 w-4"/>Save</Button>
              <Button variant="secondary" onClick={exportHTML}><Download className="mr-2 h-4 w-4"/>Export HTML</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={addFile}>+ File</Button>
                  <Select value={activeFile} onValueChange={setActiveFile}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select file" /></SelectTrigger>
                    <SelectContent>
                      {fileList.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" onClick={()=>deleteFile(activeFile)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Editor
                  height="520px"
                  language={language}
                  theme="vs-dark"
                  value={files[activeFile]}
                  onChange={(val) => setFileContent(activeFile, val ?? "")}
                  options={{ minimap: { enabled: false }, fontSize: 14, roundedSelection: true, scrollBeyondLastLine: false }}
                />
                <div className="flex items-center gap-2 p-3">
                  <Button onClick={language === "python" || activeFile.endsWith(".py") ? runPython : runWeb}>
                    <Play className="mr-2 h-4 w-4"/>
                    Run {language === "python" || activeFile.endsWith(".py") ? "Python" : "Web"}
                  </Button>
                  <Button variant="secondary" onClick={testPyodide}>Test Pyodide</Button>
                  <Button variant="outline" onClick={()=>setConsoleOut("")}><RotateCcw className="mr-2 h-4 w-4"/>Clear Console</Button>
                  {language === "python" || activeFile.endsWith(".py") ? (
                    <Badge variant={pyStatus === "ready" ? "default" : "secondary"}>Pyodide: {pyStatus}</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Preview</CardTitle>
                  <Badge variant="secondary">Sandboxed iframe</Badge>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border bg-white">
                    <iframe ref={iframeRef} title="preview" className="h-[360px] w-full rounded-2xl" srcDoc={srcDoc} sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-5 w-5"/>
                    <CardTitle className="text-xl">Console</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="h-48 w-full resize-none rounded-xl border bg-black/90 p-3 font-mono text-sm text-green-300"
                    readOnly
                    value={consoleOut}
                    placeholder="Console output will appear here..."
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-6"/>

          <Tabs defaultValue="tips" className="w-full">
            <TabsList>
              <TabsTrigger value="tips">Tips</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="tips" className="text-sm text-slate-600">
              <ul className="list-disc space-y-1 pl-6">
                <li>Edit <code>index.html</code>, <code>styles.css</code>, and <code>app.js</code> then hit <strong>Run Web</strong>.</li>
                <li>Put Python code in <code>main.py</code> or open a <code>.py</code> file and hit <strong>Run Python</strong> (the active Python file will run).</li>
                <li>Use <strong>Save</strong> to download your project and <strong>Open</strong> to restore it later.</li>
                <li><strong>Export HTML</strong> creates a single file snapshot of your current web app preview.</li>
              </ul>
            </TabsContent>
            <TabsContent value="shortcuts" className="text-sm text-slate-600">
              <ul className="list-disc space-y-1 pl-6">
                <li>Monaco editor common shortcuts: <kbd>Ctrl/Cmd + S</kbd> to save selection (use toolbar to actually download), <kbd>Ctrl/Cmd + F</kbd> find, <kbd>Alt + Click</kbd> multi-cursor.</li>
                <li>Drag the bottom of the editor to resize.</li>
              </ul>
            </TabsContent>
            <TabsContent value="about" className="text-sm text-slate-600">
              A lightweight, browser-only IDE powered by <em>@monaco-editor/react</em> and Pyodide. Runs HTML/CSS/JS in a sandboxed iframe and Python via WebAssembly.\n\nChanges in this version:\n- Fixed Pyodide import so bundlers won't produce a malformed URL (uses dynamic import with `/* @vite-ignore */` and a script fallback).\n- Added a fallback loader that attempts `pyodide.js` if module import fails.\n- Run Python now executes the active `.py` file if present; otherwise `main.py` is used.\n- Added a small "Test Pyodide" button to quickly verify the Pyodide runtime.
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
