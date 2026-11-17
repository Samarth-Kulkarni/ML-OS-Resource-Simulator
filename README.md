# ML-Augmented OS Resource Management Simulator

An interactive, full-stack Operating System Resource Management Simulator featuring an integrated Executive Telemetry Dashboard, classical and ML-augmented CPU Scheduling, Deadlock Avoidance via Dijkstra's Banker's Algorithm, Disk Head Kinematics, and an **Adaptive Policy Router with Machine Learning Burst Prediction & Two-Tier Circuit Breakers**.

Designed with the **IBM Carbon Design System** aesthetic (sharp 0px/2px geometry, high-density data tables, and IBM Plex typography) for an authentic systems engineering feel.

---

## Key Subsystems & Features

### 1. Executive Telemetry Dashboard
* **Dynamic Subsystem Health:** Live monitoring across CPU workloads, Banker's safety state, and active disk cylinders.
* **Synchronized Process Tracker:** Centrally positioned **Process State Tracking Table** (above simulation modules) that reflects processes configured and executed across the kernel.
* **Dynamic Disk Kinematics:** Live head position tracker dynamically synchronizing with active disk seek simulations and displaying total seek distance.
* **Streamlined UI:** Distraction-free telemetry layout optimized for real-time monitoring and systems demonstration.

---

### 2. CPU Scheduling Engine, SMP Multi-Core & ML Adaptive Router
* **Comprehensive Scheduling Policies:**
  * **FCFS** (First-Come, First-Served)
  * **SJF** (Shortest Job First - Non-Preemptive)
  * **SRTF** (Shortest Remaining Time First - Preemptive)
  * **Round Robin (RR)** with configurable time quantum
  * **Priority Scheduling** (Preemptive)
  * **Predicted-SJF / Adaptive Router** (ML-Driven with Fallback)
* **Multi-Core Symmetric Multiprocessing (SMP):**
  * Support for 2-core and 4-core physical layouts with parallel execution timelines.
  * Three architectural paradigms: **Dynamic Work-Stealing (SJF)**, **Static Core Affinity (Partitioned)**, and **Global Shared Round-Robin**.
  * Strict hardware mutual exclusion invariant ($\sum_{c=1}^M \mathbb{I}(P_i \text{ on core } c \text{ at tick } t) \le 1$), guaranteeing zero cross-core collision and bounded utilization.
* **Interactive CPU Clock Simulation Stepper:**
  * Controllable virtual hardware clock (Play, Pause, Step-Forward, Step-Backward, Speed slider) visualizing live transitions across `Job Pool -> Ready -> Running -> Terminated / Demoted`.
* **Multi-Model ML Architecture Benchmark Suite:**
  * Empirically compares **Decision Tree Regressor ($d=5$)**, **Random Forest ($K=50$)**, **Ridge Regression ($L_2$)**, and **Linear Regression**.
  * Ultra-low warm inference latency of **$5.37\,\mu\text{s}$**, fully compliant with the $< 50\,\mu\text{s}$ operating system dispatch deadline.
* **Two-Tier Adaptive Policy Router (Safety Fallbacks):**
  * **Tier 1 (Per-Process Slice Protection):** If a process runs out of its ML-allocated execution slice, it is immediately demoted to the Round Robin queue to prevent starvation.
  * **Tier 2 (Global EMA Circuit Breaker):** Continuously tracks prediction error ($\text{Error} = |\text{Actual} - \text{Predicted}|$) via Exponential Moving Average:
    $$\text{EMA}_{\text{new}} = \alpha \times \text{Error} + (1 - \alpha) \times \text{EMA}_{\text{prev}} \quad (\alpha = 0.3)$$
    If EMA error spikes past the configurable **Error Threshold**, the scheduler safely switches the entire system to deterministic Round Robin.
* **Adversarial Stress Test Preset:**
  * One-click adversarial workload featuring an extreme burst anomaly to demonstrate live circuit-breaker tripping and starvation demotion.
* **Multi-Algorithm Comparative Benchmark:**
  * Executes all 6 scheduling algorithms concurrently on identical workloads, measuring Waiting Time, Turnaround Time, and Response Time.

---

### 3. Deadlock Avoidance (Banker's Algorithm & Interactive RAG)
* **Deterministic Kernel Safety Invariant:** Configurable Allocation ($C$), Maximum Demand ($M$), and Available ($W$) vector matrices.
* **Need Matrix Calculation:** Real-time computation of remaining resource requirements ($\text{Need} = \text{Max} - \text{Allocation}$).
* **Safe Sequence Generation:** Step-by-step trace generation determining deadlock-free execution sequences ($\forall i, \text{Need}[i] \le \text{Work}$) or flagging unsafe states.
* **Bipartite Resource Allocation Graph (RAG):** Interactive visual graph rendering processes, resource instance nodes, active allocation edges, pending claims, and dynamic circular-wait cycle highlighting in Carbon Alert Red.

---

### 4. Disk Arm Scheduling & Kinematics (Future Scope / Prototype)
* **Algorithms Implemented:** FCFS, SSTF, SCAN (Elevator), C-SCAN, LOOK, and ML-Augmented Shortest Access Time First (ML-SATF).
* **2D Kinematic Canvas:** Interactive Cartesian traversal overlay comparing mechanical head wear and arm seek patterns across all algorithms.
* **Kinematic Metrics:** Calculates total cylinder head movement, seek distance, and 7,200 RPM rotational position latency.
* **Module Status:** Designated as future research scope with an in-progress status screen and developer preview toggle.

---

### 5. Synthetic Workload Generator & Technical Audit Report Exporter
* **Workload Generator:** Generates mathematical process arrivals under Uniform, Exponential ($\lambda=0.1$), Pareto ($\alpha=1.5$), and Adversarial distributions.
* **Report Exporter:** One-click automated export of comprehensive simulation audits in print-optimized HTML/PDF or Markdown.

---

## Tech Stack

### Backend
* **Language & Framework:** Python 3.10+ / FastAPI
* **ASGI Server:** Uvicorn
* **Data Validation:** Pydantic v2
* **Machine Learning:** Scikit-learn, Pandas, NumPy, Joblib

### Frontend
* **Framework:** React 18 + Vite
* **Styling & Design System:** Tailwind CSS + IBM Carbon Design System Tokens
* **Typography:** IBM Plex Sans (interface) + IBM Plex Mono (telemetry/numbers)
* **Icons:** Lucide React
* **HTTP Client:** Axios (with proxy routing to backend API)

---

## Repository Structure

```text
os-resource-simulator/
├── backend/
│   ├── app/
│   │   ├── algorithms/          # CPU (classical + ML router), Deadlock, & Disk engines
│   │   ├── ml/
│   │   │   ├── saved_models/    # Pre-trained decision_tree.pkl model pipeline
│   │   │   ├── models.py        # BurstPredictor class & inference logic
│   │   │   ├── generate_dataset.py  # Synthetic OS telemetry generator
│   │   │   ├── train_models.py      # Multi-model training pipeline
│   │   │   └── evaluate_models.py   # Latency & MAE evaluation scripts
│   │   ├── models/              # Pydantic schemas (Process, Requests, Responses)
│   │   ├── routers/             # API routes (/api/cpu, /api/deadlock, /api/disk)
│   │   ├── utils/               # Workload recommender & helpers
│   │   └── main.py              # FastAPI app & /api/health endpoint
│   ├── run_tests.py             # Automated unit test suite
│   ├── test_workload.csv        # Standalone 500-process test workload
│   └── requirements.txt         # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # Carbon UI Shell (Navbar, Layout)
│   │   ├── pages/               # Dashboard, CPU Scheduling, Deadlock, Disk pages
│   │   ├── services/            # Axios API client & live health check
│   │   ├── App.jsx              # Root component with shared state
│   │   ├── index.css            # Carbon base styles & custom scrollbars
│   │   └── main.jsx             # React entrypoint
│   ├── index.html               # IBM Plex Google Fonts & title
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Carbon color palette & sharp corner geometry
│   └── vite.config.js           # Vite dev server & /api proxy configuration
└── README.md                    # Project overview & quickstart guide
```

---

## Getting Started

Run the backend and frontend in separate terminals:

### 1. Backend (FastAPI)
```bash
# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
* **API Server:** `http://localhost:8000`
* **Swagger API Docs:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/api/health`

---

### 2. Frontend (React + Vite)
```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
* **Web Application:** `http://localhost:5173`
