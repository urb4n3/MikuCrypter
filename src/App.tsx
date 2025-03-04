import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Lock, LockOpen, Delete, CloudUpload } from "@mui/icons-material";
import "./App.css";

function getSocketURL() {
  const host = window.location.host.split(":")[0];
  const isLocal = host === "localhost" || host.startsWith("192.168");
  return isLocal ? `http://${host}:3000` : "/";
}

const socket = io(getSocketURL());

function MikuCrypter() {
  const [selectedTab, setSelectedTab] = useState("encrypt");
  const [file, setFile] = useState<File | null>(null);
  const [secret, setSecret] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    socket.on("log", (data: any) => {
      setLogs((prev) => [data, ...prev].slice(0, 12));
    });
    return () => {
      socket.off("log");
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const startOperation = (type: string) => {
    if (!file) {
      alert("Please upload a file");
      return;
    }

    socket.emit(type, { file: file.name, secret });
    setLogs([`Starting ${type}...`, ...logs]);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-8 flex flex-col items-center justify-center">
      <audio ref={audioRef} src="/magical_love_cure.mp3" autoPlay loop />
      
      <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg text-center relative">
        <h1 className="text-4xl font-bold text-pink-500">MikuCrypter</h1>
        <p className="text-gray-600 mb-4">Encrypt, Decrypt, and Corrupt Data with Miku!</p>
        
        <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-gray-500 italic">Miku placeholder (image or animation here)</span>
        </div>
        
        <div className="flex justify-center gap-4 mb-4">
          <button onClick={() => setSelectedTab("encrypt")} className={`p-3 text-white rounded-lg shadow-lg transition ${selectedTab === "encrypt" ? "bg-[#e12885]" : "bg-[#86cecb] hover:bg-[#137a7f]"}`}>
            <Lock className="inline-block w-5 h-5" /> Encrypt
          </button>
          <button onClick={() => setSelectedTab("decrypt")} className={`p-3 text-white rounded-lg shadow-lg transition ${selectedTab === "decrypt" ? "bg-[#e12885]" : "bg-[#86cecb] hover:bg-[#137a7f]"}`}>
            <LockOpen className="inline-block w-5 h-5" /> Decrypt
          </button>
          <button onClick={() => setSelectedTab("corrupt")} className={`p-3 text-white rounded-lg shadow-lg transition ${selectedTab === "corrupt" ? "bg-[#e12885]" : "bg-[#86cecb] hover:bg-[#137a7f]"}`}>
            <Delete className="inline-block w-5 h-5" /> Corrupt
          </button>
        </div>

        <label htmlFor="file-upload" className="p-6 bg-gray-100 rounded-lg shadow-sm border-dashed border-2 border-gray-400 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 relative">
          <CloudUpload className="text-gray-600 text-5xl mb-2" />
          <p className="text-gray-600">Drag & Drop your file here</p>
          <p className="text-gray-500 text-sm">or click to upload from your computer</p>
          <input id="file-upload" type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>
        {selectedTab !== "corrupt" && (
          <input type="text" placeholder="Enter secret (if needed)" value={secret} onChange={(e) => setSecret(e.target.value)} className="w-full p-2 border rounded-lg mt-4 focus:ring-2 focus:ring-pink-400" />
        )}
          
        <button
          onClick={() => startOperation(selectedTab)}
          className="w-full p-3 mt-4 text-white bg-[#e12885] rounded-lg shadow-lg hover:bg-[#137a7f] transition"
        >
          {selectedTab === "encrypt" && <Lock className="inline-block w-5 h-5" />} 
          {selectedTab === "decrypt" && <LockOpen className="inline-block w-5 h-5" />} 
          {selectedTab === "corrupt" && <Delete className="inline-block w-5 h-5" />} 
          Start {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
        </button>

        <div className="p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg shadow-lg mt-4 text-left">
          {logs.map((log, index) => (
            <div key={index} className="py-1">{`> ${log}`}</div>
          ))}
          {logs.length === 0 && <div className="italic text-gray-500">{"> Waiting for Miku's magic..."}</div>}
        </div>
      </div>
    </div>
  );
}

export default MikuCrypter;
