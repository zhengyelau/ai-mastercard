# AI-Mastercard Backend

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Prerequisites
- Python 3.9+

## Installation
1. Change directory to:
```bash
cd ai-mastercard/backend
```

2. Create a virtual environment:
```bash
python -m venv your-env-name
```

3. Activate the virtual environment:<br/>

Linux:
```bash
source your-env-name/bin/activate
```
Window:
```bash
.\your-env-name\Scripts\activate
```


4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Environment Variables
1. Create a .env file in the backend folder. Add the following keys:
```
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key
```

# Running project
1. To start the Flask backend server, run:
```
python app.py
```
