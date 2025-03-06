import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Lock, LockOpen, Delete, CloudUpload } from "@mui/icons-material";
import "./App.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
const socket = io(SOCKET_URL);

function MikuCrypter() {
  const [selectedTab, setSelectedTab] = useState("encrypt");
  const [files, setFiles] = useState<File[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
    }
  };

  const startOperation = async (type: string) => {
    if (files.length === 0) {
      setLogs((prev) => [`❌ Error: Please upload at least one file`, ...prev]);
      return;
    }

    for (const file of files) {
      // Log operation-specific message
      if (type === "encrypt") {
        setLogs((prev) => [`⌛ Miku is encrypting "${file.name}"...`, ...prev]);
      } else if (type === "decrypt") {
        setLogs((prev) => [`⌛ Miku is decrypting "${file.name}"...`, ...prev]);
      } else if (type === "corrupt") {
        setLogs((prev) => [`⌛ Miku is corrupting "${file.name}"...`, ...prev]);
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("operation", type);
      if (type === "encrypt" || type === "decrypt") {
        formData.append("secret", secret);
      }

      try {
        const response = await fetch(`${SOCKET_URL}/api/files/process`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (type === "encrypt") {
            setLogs((prev) => [
              `❌ Miku encountered an error while encrypting "${file.name}": ${errorData.error}`,
              ...prev,
            ]);
          } else if (type === "decrypt") {
            setLogs((prev) => [
              `❌ Miku encountered an error while decrypting "${file.name}": ${errorData.error}`,
              ...prev,
            ]);
          } else if (type === "corrupt") {
            setLogs((prev) => [
              `❌ Miku encountered an error while corrupting "${file.name}": ${errorData.error}`,
              ...prev,
            ]);
          }
          continue;
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = file.name;

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
            filename = match[1];
          }
        } else {
          if (type === "encrypt") {
            filename = file.name + ".mikucrypt";
          } else if (type === "decrypt" && file.name.endsWith(".mikucrypt")) {
            filename = file.name.replace(".mikucrypt", "");
          }
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        if (type === "encrypt") {
          setLogs((prev) => [
            `✅ Miku successfully encrypted "${file.name}" as "${filename}"`,
            ...prev,
          ]);
        } else if (type === "decrypt") {
          setLogs((prev) => [
            `✅ Miku successfully decrypted "${file.name}" as "${filename}"`,
            ...prev,
          ]);
        } else if (type === "corrupt") {
          setLogs((prev) => [
            `✅ Miku successfully corrupted "${file.name}"`,
            ...prev,
          ]);
        }
      } catch (error: any) {
        if (type === "encrypt") {
          setLogs((prev) => [
            `❌ Miku encountered an error while encrypting "${file.name}": ${
              error.message || error
            }`,
            ...prev,
          ]);
        } else if (type === "decrypt") {
          setLogs((prev) => [
            `❌ Miku encountered an error while decrypting "${file.name}": ${
              error.message || error
            }`,
            ...prev,
          ]);
        } else if (type === "corrupt") {
          setLogs((prev) => [
            `❌ Miku encountered an error while corrupting "${file.name}": ${
              error.message || error
            }`,
            ...prev,
          ]);
        }
      }
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-8 flex flex-col items-center justify-center relative">
      <audio ref={audioRef} src="/magical_love_cure.mp3" autoPlay loop />
      <h1 className="text-4xl font-bold text-pink-500">MikuCrypter</h1>
      <p className="text-gray-600 mb-4 mt-4">
        Miku is here to help you encrypt, decrypt, or corrupt your files!
      </p>
      <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg text-center relative">
        <div className="flex justify-center mb-4">
          <img
            src="/mikuHero.jpg"
            alt="Miku"
            className="max-h-full object-contain rounded-lg"
          />
        </div>
        <div className="flex justify-center gap-4 mb-4 mt-4">
          <button
            onClick={() => setSelectedTab("encrypt")}
            className={`p-3 text-white rounded-lg shadow-lg transition ${
              selectedTab === "encrypt"
                ? "bg-pink-600"
                : "bg-cyan-600 hover:bg-red-600"
            }`}
          >
            <Lock className="inline-block w-5 h-5" /> Encrypt
          </button>
          <button
            onClick={() => setSelectedTab("decrypt")}
            className={`p-3 text-white rounded-lg shadow-lg transition ${
              selectedTab === "decrypt"
                ? "bg-pink-600"
                : "bg-cyan-600 hover:bg-red-600"
            }`}
          >
            <LockOpen className="inline-block w-5 h-5" /> Decrypt
          </button>
          <button
            onClick={() => setSelectedTab("corrupt")}
            className={`p-3 text-white rounded-lg shadow-lg transition ${
              selectedTab === "corrupt"
                ? "bg-pink-600"
                : "bg-cyan-600 hover:bg-red-600"
            }`}
          >
            <Delete className="inline-block w-5 h-5" /> Corrupt
          </button>
        </div>
        <label
          htmlFor="file-upload"
          className="p-6 bg-gray-100 rounded-lg shadow-sm border-dashed border-2 border-gray-400 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 relative"
        >
          <CloudUpload className="text-gray-600 text-5xl mb-2" />
          {files.length === 0 ? (
            <>
              <p className="text-gray-600">Drag & Drop your file(s) here</p>
              <p className="text-gray-500 text-sm">
                or click to upload from your computer
              </p>
            </>
          ) : (
            <>
              <p className="text-green-600 font-bold">Selected file(s):</p>
              {files.map((file, index) => (
                <p key={index} className="text-green-600">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB, {file.type})
                </p>
              ))}
            </>
          )}
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <div className="w-full mt-4">
          {selectedTab !== "corrupt" ? (
            <input
              type="text"
              placeholder="Enter secret..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
            />
          ) : (
            <div className="w-full p-2 border rounded-lg opacity-0">
              Reserved
            </div>
          )}
        </div>
        <button
          onClick={() => startOperation(selectedTab)}
          className="w-full p-3 mt-4 text-white bg-pink-600 rounded-lg shadow-lg hover:bg-red-600 transition"
        >
          {selectedTab === "encrypt" && (
            <Lock className="inline-block w-5 h-5" />
          )}
          {selectedTab === "decrypt" && (
            <LockOpen className="inline-block w-5 h-5" />
          )}
          {selectedTab === "corrupt" && (
            <Delete className="inline-block w-5 h-5" />
          )}
          Start {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
        </button>
        <div className="logs-container p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg shadow-lg mt-4 text-left">
          {logs.map((log, index) => (
            <div key={index} className="py-1">{`> ${log}`}</div>
          ))}
          {logs.length === 0 && (
            <div className="italic text-gray-500">
              {"> Waiting for Miku's action..."}
            </div>
          )}
        </div>
      </div>
      <footer className="mt-8 border-t border-gray-300 pt-4 text-gray-500 text-sm flex items-center justify-center gap-2">
        <span>
          Made by{" "}
          <a
            href="https://github.com/urb4n3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:underline"
          >
            urb4n3
          </a>{" "}
          with love for OpenSource &lt;3
        </span>
      </footer>
    </div>
  );
}

export default MikuCrypter;
