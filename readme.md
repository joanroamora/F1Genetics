# F1 Genetics - AI Evolution Simulation

**F1 Genetics** is a machine learning project that uses **Genetic Algorithms** and **Neural Networks** to train autonomous agents to navigate complex racing circuits. The agents evolve over generations, learning to interpret sensor data to avoid obstacles and optimize their path through the track.

## 🚀 Key Features

* **Self-Evolving AI**: Agents use a feedforward neural network to make real-time driving decisions.
* **Raycasting Vision**: Each agent is equipped with a 7-ray sensor system providing a 180° field of view to detect track boundaries.
* **Genetic Algorithm**: Features a robust evolution engine with:
    * **Fitness Tracking**: Performance is measured by checkpoint progression and distance.
    * **Stagnation Handling**: Automatically increases mutation rates or resets the brain if progress stalls for too many generations.
* **Multiple Training Environments**: Includes various tracks optimized for different learning stages:
    * **Ideal Track**: Base training for acceleration and smooth curves.
    * **Ideal 2 & 3**: High-speed straights and perfect circles for advanced handling.
    * **Monaco GP**: The ultimate technical challenge based on the real-world circuit.
* **Brain Persistence**: Export trained neural networks to `.json` files and reload them to bypass early training stages.
* **CI/CD Integrated**: Automated testing via GitHub Actions to ensure code stability on every push.

## 🛠️ Tech Stack

* **Backend**: Python 3.12 with **Flask**.
* **Frontend**: HTML5 Canvas, CSS3, and Vanilla JavaScript.
* **DevOps**: GitHub Actions for Continuous Integration.

## 📂 Project Structure

```text
F1Genetics/
├── .github/workflows/
│   └── ci.yml              # GitHub Actions pipeline
├── static/
│   ├── brains/             # Storage for exported master brains
│   └── js/
│       ├── car.js          # Agent physics and control logic
│       ├── main.js         # Evolution engine and orchestrator
│       ├── network.js      # Neural Network implementation
│       ├── sensor.js       # Raycasting sensor logic
│       └── tracks_data.js  # Coordinate data for all circuits
├── templates/
│   ├── index.html          # Live simulation interface
│   └── setup.html          # Configuration and entry page
├── app.py                  # Flask application entry point
└── requirements.txt        # Python dependencies
```

## ⚙️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/joanroamora/F1Genetics.git](https://github.com/joanroamora/F1Genetics.git)
    cd F1Genetics
    ```

2.  **Set up the environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Run the application**:
    ```bash
    python app.py
    ```

4.  **Access the simulation**:
    Open your browser and navigate to `http://127.0.0.1:5000/`.

## 🎮 How to Use

1.  **Configuration**: On the Setup page, select your track, population size, and initial brain state.
    * **Start from Scratch**: Best for watching the learning process from zero.
    * **Load Master Brain**: Loads a pre-trained expert from `static/brains/`.
2.  **Training**: Click **"Start Engines"** in the simulation view.
3.  **Exporting**: Once an agent demonstrates superior logic, click **"Export Brain"** to save its neural weights as a JSON file.
4.  **Persistence**: Move exported files to `static/brains/` and rename them (e.g., `monaco_best.json`) to use them as master brains in future sessions.

## 🧪 CI/CD Pipeline

The project includes a GitHub Actions workflow (`ci.yml`) that triggers on pushes to `main` and `monaco` branches. It performs:
* Python dependency installation.
* Syntax validation (Linter).
* **Smoke Test**: Automatically launches the Flask server and verifies the setup page is reachable.