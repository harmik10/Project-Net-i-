"use client";

import { useEffect, useState, useRef } from "react";
import TrafficCharts from "@/components/TrafficCharts";

// Define the shape of our packet data
interface Packet {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  details?: string;
  is_sensitive?: boolean;
  sensitive_data?: string;
}

interface Device {
  ip: string;
  mac: string;
}

export default function Home() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [filteredPackets, setFilteredPackets] = useState<Packet[]>([]);
  const [filterText, setFilterText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [throttleDelay, setThrottleDelay] = useState(0); // 0 = Max Speed, 2 = Slowest
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New State for Feature 3 & Scanning
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  // Feature 4: Captured Secrets
  const [secrets, setSecrets] = useState<Packet[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to Sniffer");
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected from Sniffer");
    };

    ws.onmessage = (event) => {
      if (isPaused) return;

      const data = JSON.parse(event.data);
      setPackets((prev) => {
        // Keep last 500 packets (increased buffer for better charts)
        const newPackets = [...prev, data];
        if (newPackets.length > 500) return newPackets.slice(-500);
        return newPackets;
      });

      // Check for secrets
      if (data.is_sensitive) {
        setSecrets(prev => [data, ...prev]);
      }
    };

    return () => {
      ws.close();
    };
  }, [isPaused]);

  // Handle Filtering
  useEffect(() => {
    if (!filterText) {
      setFilteredPackets(packets);
    } else {
      const lowerFilter = filterText.toLowerCase();
      const filtered = packets.filter(
        (p) =>
          p.source.toLowerCase().includes(lowerFilter) ||
          p.destination.toLowerCase().includes(lowerFilter) ||
          p.protocol.toLowerCase().includes(lowerFilter) ||
          p.info.toLowerCase().includes(lowerFilter)
      );
      setFilteredPackets(filtered);
    }
  }, [packets, filterText]);


  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !isPaused && !filterText) { // Only auto-scroll if not filtering
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredPackets, isPaused, filterText]);

  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseFloat(e.target.value);
    setThrottleDelay(newDelay);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ delay: newDelay }));
    }
  };

  const handleScanNetwork = async () => {
    setShowDevices(true);
    setIsScanning(true);
    setDevices([]);
    try {
      // Use relative path since we are served from the same origin now
      const res = await fetch("/scan");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="h-screen bg-slate-950 text-slate-200 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500"}`}></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            NET<span className="text-blue-500">i</span> <span className="text-xs font-normal text-slate-500 ml-2">v2.0.0</span>
          </h1>
        </div>

        {/* Filter Input */}
        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            placeholder="Filter IP, Protocol, or Info..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Speed Slider */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-slate-400">SPEED:</span>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.1"
              value={throttleDelay}
              onChange={handleThrottleChange}
              className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title={`Delay: ${throttleDelay}s`}
            />
            <span className={`text-xs w-8 ${throttleDelay === 0 ? "text-emerald-500 font-bold" : "text-slate-400"}`}>
              {throttleDelay === 0 ? "LIVE" : `${throttleDelay}s`}
            </span>
          </div>

          <button
            onClick={handleScanNetwork}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded border border-emerald-500/50 transition-colors flex items-center gap-2"
          >
            <span>📡</span> SCAN NET
          </button>

          <button
            onClick={() => setPackets([])}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
          >
            CLEAR
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-1.5 text-xs font-semibold rounded border transition-all ${isPaused
              ? "bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20"
              : "bg-blue-500/10 border-blue-500/50 text-blue-500 hover:bg-blue-500/20"
              }`}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </header>

      {/* Traffic Charts Section */}
      <TrafficCharts packets={packets} />

      {/* ALERT SECTION: Dedicated area for Intercepted Data */}
      {secrets.length > 0 && (
        <div className="bg-red-950/30 border-y border-red-500/50 p-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-red-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="animate-pulse">⚠️</span> Intercepted Plaintext Data (HTTP)
            </h2>
            <button onClick={() => setSecrets([])} className="text-xs text-red-400/50 hover:text-red-400">CLEAR ALERTS</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {secrets.map((secret, i) => (
              <div key={i} className="bg-red-950/50 border border-red-500/30 rounded p-3 text-xs font-mono overflow-hidden relative group">
                <div className="flex justify-between items-center text-red-300/70 mb-1 border-b border-red-500/20 pb-1">
                  <span>{secret.source} → {secret.destination}</span>
                  <span>{secret.timestamp}</span>
                </div>
                <pre className="text-red-200 whitespace-pre-wrap break-all max-h-24 overflow-auto">
                  {secret.sensitive_data}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packet Table Header */}
      <div className="bg-slate-900/50 border-b border-b-slate-800 border-t border-t-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider flex pr-4">
        <div className="p-2 w-24 flex-shrink-0">Time</div>
        <div className="p-2 w-36 flex-shrink-0">Source</div>
        <div className="p-2 w-36 flex-shrink-0">Destination</div>
        <div className="p-2 w-20 flex-shrink-0">Proto</div>
        <div className="p-2 w-20 flex-shrink-0 text-right">Len</div>
        <div className="p-2 flex-1">Info</div>
      </div>

      {/* Packet List */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-slate-950 p-0 relative">
        {filteredPackets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <div className="mb-2 text-4xl opacity-20">📡</div>
              <p>{filterText ? "No packets match your filter" : "Waiting for packets..."}</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <tbody>
              {filteredPackets.map((pkt, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer ${pkt.protocol === "DNS" ? "text-purple-300 font-bold" : pkt.protocol === "TCP" ? "text-blue-100" :
                    pkt.protocol === "UDP" ? "text-amber-100" : "text-slate-300"
                    }`}
                >
                  <td className="p-2 w-24 font-mono text-slate-500 truncate">{pkt.timestamp}</td>
                  <td className="p-2 w-36 font-mono truncate" title={pkt.source}>{pkt.source}</td>
                  <td className="p-2 w-36 font-mono truncate" title={pkt.destination}>{pkt.destination}</td>
                  <td className="p-2 w-20 font-bold">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${pkt.protocol === "DNS" ? "bg-purple-500/10 text-purple-400" : pkt.protocol === "TCP" ? "bg-blue-500/10 text-blue-400" :
                      pkt.protocol === "UDP" ? "bg-amber-500/10 text-amber-400" :
                        "bg-slate-700/30 text-slate-400"
                      }`}>
                      {pkt.protocol}
                    </span>
                  </td>
                  <td className="p-2 w-20 text-right font-mono text-slate-500">{pkt.length}</td>
                  <td className="p-2 text-slate-400 truncate" title={pkt.info}>{pkt.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 p-2 text-xs text-slate-500 flex justify-between z-10">
        <div>
          Captured: <span className="text-slate-300">{packets.length}</span> packets
          {isPaused && <span className="text-amber-500 ml-2">(PAUSED)</span>}
          {filterText && <span className="text-blue-500 ml-2">(FILTER ACTIVE)</span>}
        </div>
        <div>
          {isConnected ? "Live Capture Active" : "Connecting..."}
        </div>
      </footer>

      {/* MODAL: Device List */}
      {
        showDevices && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowDevices(false)}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">📡 Network Devices (ARP Scan)</h2>
                <button onClick={() => setShowDevices(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              {isScanning ? (
                <div className="text-center py-8 text-slate-400 animate-pulse">Scanning network...</div>
              ) : (
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-2">IP Address</th>
                        <th className="p-2">MAC Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.length === 0 ? (
                        <tr><td colSpan={2} className="p-4 text-center text-slate-500">No devices found.</td></tr>
                      ) : devices.map((dev, i) => (
                        <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="p-2 font-mono text-emerald-400">{dev.ip}</td>
                          <td className="p-2 font-mono text-slate-400">{dev.mac}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* MODAL: Packet Details */}
      {
        selectedPacket && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPacket(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-lg">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${selectedPacket.protocol === "DNS" ? "bg-purple-500/20 text-purple-400" : selectedPacket.protocol === "TCP" ? "bg-blue-500/20 text-blue-400" :
                    selectedPacket.protocol === "UDP" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-700/50 text-slate-400"
                    }`}>{selectedPacket.protocol}</span>
                  Packet Details
                </h2>
                <button onClick={() => setSelectedPacket(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-0 overflow-auto font-mono text-xs bg-slate-950 text-slate-300">
                <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-800 bg-slate-900/30">
                  <div><span className="text-slate-500">Time:</span> {selectedPacket.timestamp}</div>
                  <div><span className="text-slate-500">Length:</span> {selectedPacket.length} bytes</div>
                  <div><span className="text-slate-500">Source:</span> {selectedPacket.source}</div>
                  <div><span className="text-slate-500">Destination:</span> {selectedPacket.destination}</div>
                </div>
                <div className="p-4">
                  <h3 className="text-slate-500 font-bold mb-2 uppercase tracking-wider text-[10px]">Deep Packet Inspection</h3>
                  <pre className="whitespace-pre-wrap text-emerald-500/90 leading-relaxed font-mono bg-black/30 p-4 rounded border border-slate-800/50">
                    {selectedPacket.details || "No raw data captured."}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </main >
  );
}
