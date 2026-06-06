# DerramaAI CDMX

An interactive web application built with Streamlit to estimate and analyze the economic impact of events in Mexico City (CDMX). The model segments visitor types to prevent spending substitution bias and ensure economic calculation rigor.

---

## Project Structure

```text
.
├── .gitignore
└── frontend/
    ├── app.py
    └── requirements.txt

## Usage
git clone <your-repository-url>
cd <your-repository-folder>

Create virtual enviroment:
### Linux or MacOS
python3 -m venv .venv
source .venv/bin/activate

### Windows:
python -m venv .venv
.venv\Scripts\activate

## Install dependecies:
pip install -r frontend/requirements.txt

## Runnig frontend:
streamlit run frontend/app.py
