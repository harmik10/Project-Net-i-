# Project-Net-i-
NETi is a real-time network visualization tool that scans local networks and captures live packets. It identifies devices, monitors protocols like HTTP, DNS, TCP, and UDP, and streams packet data via WebSockets to a frontend, helping users analyze traffic, detect sensitive data, and understand network activity interactively.

# NETi - Network Intelligence Tool

NETi is a powerful network scanning and analysis tool designed for real-time monitoring and security assessment. It provides a modern dashboard to visualize network traffic, discover connected devices, and identify potential vulnerabilities.

![Project NETi](https://via.placeholder.com/800x400.png?text=NETi+Dashboard)

## 🚀 Key Features
- **Real-time Packet Sniffing**: Capture and analyze network traffic live.
- **Device Discovery**: Automatically scan and list devices on your local network.
- **Visual Dashboard**: Interactive charts and logs for easy analysis.
- **Unified Setup**: Simple one-click installation and run script.

---

## 🛠️ Prerequisites

Before running this project, ensure you have the following installed on your machine:

1.  **Python** (3.8 or higher) - [Download Here](https://www.python.org/downloads/)
    *   *Make sure to check "Add Python to PATH" during installation.*
2.  **Node.js** (LTS version) - [Download Here](https://nodejs.org/)
3.  **Git** (Optional, for cloning) - [Download Here](https://git-scm.com/downloads)
4.  **Npcap** (Windows users only) - [Download Here](https://npcap.com/)
    *   *Required for packet sniffing. Install with "Install Npcap in WinPcap API-compatible Mode" checked.*

---

## 📥 Installation

### 1. Download the Project
Clone the repository using Git:
```bash
git clone https://github.com/harmik10/Project-Net-i-.git
```
Or download the **ZIP** file from GitHub and extract it.

### 2. Navigate to the Folder
Open your terminal (Command Prompt or PowerShell) and go to the project directory:
```bash
cd "Project-Net-i-"
```
*(Note: If you extracted a ZIP, the folder name might be slightly different).*

---

## ▶️ How to Run

We have included a simple **automated script** to set up everything for you.

### Windows (One-Click)
1.  Double-click the `run_app.bat` file in the project folder.
2.  The script will automatically:
    -   Install Python dependencies (in a virtual environment).
    -   Install Node.js dependencies for the frontend.
    -   Build the frontend application.
    -   Start the backend server.
3.  Once the server starts, open your browser and go to:
    **[http://localhost:8000](http://localhost:8000)**

*(Note: The first run might take a few minutes to install everything. Subsequent runs will be much faster.)*

### Manual Setup (Linux / Mac / Advanced Users)

If you prefer to run it manually or are on a non-Windows system:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
```
*(The backend serves the built frontend files automatically).*

---

## ⚠️ Troubleshooting

-   **"Npcap not found" error**: Ensure you installed Npcap (link above) with WinPcap compatibility enabled.
-   **Port 8000 already in use**: Close other applications using port 8000 or restart your computer.
-   **Permission Denied**: Try running the script or terminal as **Administrator**, as network scanning often requires higher privileges.

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.
