from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import os

from fastapi.middleware.cors import CORSMiddleware
import threading
import asyncio
import json
from scapy.all import sniff, IP, TCP, UDP, Ether, ARP, srp, DNS, DNSQR, Raw
import time


from datetime import datetime

import uvicorn

app = FastAPI()

print("\n--- NETi: Network Visualization Tool v2.0.0 ---\n")

# Allow connection from Next.js (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/scan")
def scan_network():
    """Performs an ARP scan to find devices on the local network."""
    # We assume a common subnet like 192.168.1.0/24. 
    # In a real app, we would detect the local IP and subnet dynamically.
    # For simplicity, we'll try to guess based on the machine's IP, 
    # or default to a common range.
    
    target_ip = "192.168.1.1/24" # Default fallback
    
    # Try to get actual route (Windows specific trick)
    try:
        # A simple trick to get local IP
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        # Create subnet string (e.g., 192.168.1.0/24)
        target_ip = ".".join(local_ip.split('.')[:3]) + ".0/24"
    except:
        pass

    print(f"Scanning target: {target_ip}")
    
    # Create ARP packet
    arp = ARP(pdst=target_ip)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = ether/arp

    # Send packet and wait for response (timeout 2s)
    result = srp(packet, timeout=2, verbose=0)[0]

    devices = []
    for sent, received in result:
        devices.append({'ip': received.psrc, 'mac': received.hwsrc})

    return devices

# Store active websocket connections
active_connections: list[WebSocket] = []
main_loop = None
packet_delay = 0.0  # Seconds to wait between packets

async def connect(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

def disconnect(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)

async def broadcast_packet(packet_data: dict):
    # Iterate over copy to avoid modification during iteration
    for connection in active_connections.copy():
        try:
            await connection.send_json(packet_data)
        except Exception:
            disconnect(connection)

# --- Scapy Packet Processing ---
def packet_callback(packet):
    global packet_delay
    
    # Artificial Throttling
    if packet_delay > 0:
        time.sleep(packet_delay)

    # Only process IP packets for now to keep it simple
    if IP in packet:
        src = packet[IP].src
        dst = packet[IP].dst
        
        # Determine Protocol
        protocol_name = "OTHER"
        info = "Unknown Packet"
        is_sensitive = False
        sensitive_data = ""

        # Check for DNS
        if packet.haslayer(DNS) and packet.haslayer(DNSQR):
            protocol_name = "DNS"
            try:
                # Extract query name (bytes -> str)
                query = packet[DNSQR].qname.decode("utf-8")
                info = f"DNS Query: {query}"
            except:
                info = "DNS Query"
        elif TCP in packet:
            protocol_name = "TCP"
            try:
                info = packet.summary()
                # Basic HTTP Sniffing
                if packet.haslayer(Raw):
                    try:
                        payload = packet[Raw].load.decode('utf-8', 'ignore')
                        # Check for HTTP methods to better identify
                        if "HTTP" in payload:
                             protocol_name = "HTTP"
                             info = f"HTTP: {payload.splitlines()[0][:50]}" 
                        
                        # Check for sensitive data (POST requests, passwords, etc)
                        if "POST" in payload or "pass" in payload.lower() or "user" in payload.lower() or "login" in payload.lower():
                             # Mark as sensitive if it looks like form data
                             is_sensitive = True
                             sensitive_data = payload[:500] # Capture first 500 chars
                    except:
                        pass
            except:
                pass
        elif UDP in packet:
            protocol_name = "UDP"
            try:
                info = packet.summary()
            except:
                pass
        else:
            try:
                info = packet.summary()
            except:
                pass

        # Safe extraction of detailed dump
        try:
            # show(dump=True) returns a string representation
            details = packet.show(dump=True)
        except:
            details = "No details available."

        packet_info = {
            "id": str(time.time()), # Unique ID based on time
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "source": src,
            "destination": dst,
            "protocol": protocol_name,
            "length": len(packet),
            "info": info,
            "details": details,
            "is_sensitive": is_sensitive,
            "sensitive_data": sensitive_data
        }
        
        # Broadcast to websockets
        # Must be thread-safe since this runs in a separate thread
        if main_loop and main_loop.is_running():
            asyncio.run_coroutine_threadsafe(broadcast_packet(packet_info), main_loop)

def start_sniffing():
    # sniff(store=False) prevents memory buildup
    # prn is the callback
    print("Beginning packet capture...")
    sniff(prn=packet_callback, store=False)

@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()
    
    # Run Scapy in a separate thread
    sniff_thread = threading.Thread(target=start_sniffing, daemon=True)
    sniff_thread.start()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global packet_delay
    await connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for control messages
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if "delay" in message:
                    packet_delay = float(message["delay"])
                    print(f"Updated packet delay to: {packet_delay}s")
            except:
                pass # Ignore non-JSON or invalid messages
    except WebSocketDisconnect:
        active_connections.remove(websocket)

# Mount the frontend static files
# Checks if the directory exists to avoid errors during development if build is missing
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")
else:
    print(f"Warning: Frontend build not found at {frontend_path}. Run 'npm run build' in frontend directory.")

if __name__ == "__main__":
    # Host 0.0.0.0 allows access from other devices (like your mobile)
    uvicorn.run(app, host="localhost", port=8000)
