const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Disable API caching to prevent browsers from caching project lists and state loads
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Logging middleware for debugging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, req.method !== 'GET' ? req.body : '');
  next();
});

// Serve static frontend files from the current directory
app.use(express.static(__dirname));

// Ensure data and projects directories exist
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR);
}

// Migration: If data/canvases/ existed, let's copy files over to projects/ as legacy projects!
const LEGACY_CANVASES_DIR = path.join(DATA_DIR, 'canvases');
if (fs.existsSync(LEGACY_CANVASES_DIR)) {
  try {
    const legacyFiles = fs.readdirSync(LEGACY_CANVASES_DIR);
    legacyFiles.forEach(file => {
      if (file === '_active.json' || !file.endsWith('.json')) return;
      const src = path.join(LEGACY_CANVASES_DIR, file);
      const dest = path.join(PROJECTS_DIR, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    });
    console.log('Legacy canvases migrated to projects folder.');
  } catch (e) {
    console.warn('Migration warning:', e);
  }
}

// --------------------------------------------------------------------------
// 📂 File-Based JSON DB Helpers
// --------------------------------------------------------------------------

const getActiveMetaPath = () => path.join(DATA_DIR, 'last_active.json');
const getProjectPath = (id) => path.join(PROJECTS_DIR, `${id}.json`);

// Helper: Save the last active project ID
function saveLastActiveId(id) {
  try {
    fs.writeFileSync(getActiveMetaPath(), JSON.stringify({ lastActiveId: id }), 'utf8');
  } catch (e) {
    console.error('Failed to save last active metadata:', e);
  }
}

// Helper: Get the last active project ID
function getLastActiveId() {
  const metaPath = getActiveMetaPath();
  if (fs.existsSync(metaPath)) {
    try {
      const data = fs.readFileSync(metaPath, 'utf8');
      return JSON.parse(data).lastActiveId;
    } catch (e) {
      console.error('Failed to read last active metadata:', e);
    }
  }
  return null;
}

// Helper: Initialize a fresh default project
function createDefaultProject(lang = 'ko') {
  const defaultId = 'proj-default';
  const defaultPath = getProjectPath(defaultId);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  const title = lang === 'en' ? 'Default Mind Map' : '기본 생각 지도';
  
  const defaultProj = {
    id: defaultId,
    title: title,
    date: dateStr,
    updatedAt: now.toISOString(),
    memos: [], // Empty: client app will populate seeds dynamically
    history: []
  };

  fs.writeFileSync(defaultPath, JSON.stringify(defaultProj, null, 2), 'utf8');
  saveLastActiveId(defaultId);
  return defaultProj;
}

// --------------------------------------------------------------------------
// 🌐 API Routes for Project-based Mind Mapping
// --------------------------------------------------------------------------

// 1. GET /api/projects/active - Retrieve the last active project on startup
app.get('/api/projects/active', (req, res) => {
  const lastActiveId = getLastActiveId();
  
  if (lastActiveId) {
    const activePath = getProjectPath(lastActiveId);
    if (fs.existsSync(activePath)) {
      try {
        const data = fs.readFileSync(activePath, 'utf8');
        return res.json(JSON.parse(data));
      } catch (err) {
        console.error('Error loading last active project file:', err);
      }
    }
  }

  // Fallback 1: Get the first available project in folder
  try {
    const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      const firstProjId = path.basename(files[0], '.json');
      const firstProjPath = getProjectPath(firstProjId);
      const data = fs.readFileSync(firstProjPath, 'utf8');
      saveLastActiveId(firstProjId);
      return res.json(JSON.parse(data));
    }
  } catch (e) {
    console.error('Error finding fallback project files:', e);
  }

  // Fallback 2: No projects exist, create default project
  console.log('No active project found. Initializing default project.');
  const lang = req.query.lang || 'ko';
  const defaultProject = createDefaultProject(lang);
  return res.json(defaultProject);
});

// 2. GET /api/projects - List all projects in projects/ folder
app.get('/api/projects', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = [];

    files.forEach(file => {
      if (!file.endsWith('.json')) return;
      const filePath = path.join(PROJECTS_DIR, file);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        projects.push({
          id: parsed.id || path.basename(file, '.json'),
          title: parsed.title || '이름 없는 프로젝트',
          date: parsed.date || '날짜 없음',
          memoCount: parsed.memos ? parsed.memos.length : 0,
          updatedAt: parsed.updatedAt || parsed.date || ''
        });
      } catch (err) {
        console.error(`Error reading project file ${file}:`, err);
      }
    });

    // Sort by latest updated
    projects.sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));
    return res.json(projects);
  } catch (e) {
    console.error('Error listing projects:', e);
    return res.status(500).json({ error: 'Failed to retrieve projects list.' });
  }
});

// 3. GET /api/projects/:id - Load specific project and cache active ID
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectPath = getProjectPath(id);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project workspace not found' });
  }

  try {
    const data = fs.readFileSync(projectPath, 'utf8');
    saveLastActiveId(id); // Set as the active workspace!
    return res.json(JSON.parse(data));
  } catch (e) {
    console.error(`Error loading project ID ${id}:`, e);
    return res.status(500).json({ error: 'Failed to load project state.' });
  }
});

// 4. POST /api/projects - Create or overwrite a project state (Autosave & Register)
app.post('/api/projects', (req, res) => {
  const { id, title, memos, history } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'ID and Title are required.' });
  }

  const projectPath = getProjectPath(id);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  try {
    const saveData = {
      id,
      title,
      date: dateStr,
      updatedAt: now.toISOString(),
      memos: memos || [],
      history: history || []
    };

    fs.writeFileSync(projectPath, JSON.stringify(saveData, null, 2), 'utf8');
    saveLastActiveId(id); // Always sync active workspace state!
    
    return res.json({ success: true, project: saveData });
  } catch (e) {
    console.error(`Error saving project ID ${id}:`, e);
    return res.status(500).json({ error: 'Failed to save project.' });
  }
});

// 5. POST /api/projects/:id/rename - Quick rename API
app.post('/api/projects/:id/rename', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const projectPath = getProjectPath(id);
  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project workspace not found' });
  }

  try {
    const fileContent = fs.readFileSync(projectPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    
    parsed.title = title;
    parsed.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(projectPath, JSON.stringify(parsed, null, 2), 'utf8');
    return res.json({ success: true, title: title });
  } catch (e) {
    console.error(`Error renaming project ${id}:`, e);
    return res.status(500).json({ error: 'Failed to rename project.' });
  }
});

// 6. DELETE /api/projects/:id - Safely delete a project
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectPath = getProjectPath(id);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project workspace not found' });
  }

  try {
    fs.unlinkSync(projectPath);
    
    // If the active project was deleted, clear the cached ID
    const lastActiveId = getLastActiveId();
    if (lastActiveId === id) {
      const metaPath = getActiveMetaPath();
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }
    }
    
    return res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting project ${id}:`, e);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// Get server-side API keys registration status (returns boolean exist status for security)
app.get('/api/keys/status', (req, res) => {
  return res.json({
    gemini: !!process.env.GEMINI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY
  });
});

// GET /api/recommend-merge - Evaluates active thoughts and picks the best pair for synergy
app.post('/api/recommend-merge', async (req, res) => {
  const { memos, customApiKey, provider, language } = req.body;

  if (!memos || memos.length < 2) {
    return res.status(400).json({ error: 'At least 2 memos are required for recommendation.' });
  }

  const selectedProvider = provider || 'gemini';
  const lang = language || 'ko';

  // Offline or Simulator fallback
  if (selectedProvider === 'simulator') {
    const fallbackResult = runRecommendMergeSimulator(memos, lang);
    return res.json({ success: true, ...fallbackResult });
  }

  // Construct LLM Prompt
  let promptText = "";
  if (lang === 'en') {
    promptText = `You are a thought synergy analyzer.
Analyze the following thought dewdrops active on a mind map canvas board:
${memos.map((m, idx) => `[ID: ${m.id}] (${idx + 1}): ${m.text}`).join('\n')}

Review all of them, identify the two thought dewdrops that would yield the most beautiful, creative, or logically valuable synergy if merged together.
You MUST output ONLY a raw JSON object containing the IDs of the two chosen thought dewdrops and a very brief reason (1 sentence) in English:
{
  "idA": "ID of the first chosen thought",
  "idB": "ID of the second chosen thought",
  "reason": "Very brief 1-sentence English explanation of why these two were selected for synergy."
}
Do not include any markdown blocks (e.g. no \`\`\`json), no headers, no conversational text. Output strictly raw JSON.`;
  } else {
    promptText = `당신은 생각의 연관성과 시너지를 분석하는 생각 지능 분석가입니다.
현재 캔버스 보드에 생성되어 있는 생각 물방울 목록은 다음과 같습니다:
${memos.map((m, idx) => `[ID: ${m.id}] (${idx + 1}): ${m.text}`).join('\n')}

이 생각들을 모두 검토하여, 함께 합쳐졌을 때 가장 창의적이고, 논리적이며, 유용한 깊은 생각 시너지를 만들어낼 수 있는 최고의 생각 물방울 2개를 선정해 주세요.
반드시 아래의 JSON 형식을 완벽히 지켜서 한글 설명과 함께 출력해 주세요. 마크다운 기호(\`\`\`json 등)나 대화식 문장, 부연 설명을 절대 포함하지 말고 **오직 순수 JSON 데이터만** 반환해야 합니다:
{
  "idA": "선정된 첫 번째 생각 물방울의 ID",
  "idB": "선정된 두 번째 생각 물방울의 ID",
  "reason": "이 두 생각이 만나면 왜 좋은 시너지를 내는지 설명하는 한글 한 줄 설명 (1문장 이내)"
}`;
  }

  const apiKey = customApiKey || (selectedProvider === 'gemini' ? process.env.GEMINI_API_KEY : selectedProvider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.OPENROUTER_API_KEY);

  if (!apiKey) {
    console.log('No API Key found for recommendation. Falling back to offline simulator.');
    const fallbackResult = runRecommendMergeSimulator(memos, lang);
    return res.json({ success: true, ...fallbackResult });
  }

  try {
    let resultText = "";
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    if (selectedProvider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) throw new Error(`Gemini status ${response.status}`);
      const data = await response.json();
      resultText = data.candidates[0].content.parts[0].text;

    } else if (selectedProvider === 'deepseek') {
      const url = 'https://api.deepseek.com/chat/completions';
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error(`DeepSeek status ${response.status}`);
      const data = await response.json();
      resultText = data.choices[0].message.content;

    } else if (selectedProvider === 'openrouter') {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Dewdrop Canvas'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.2,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error(`OpenRouter status ${response.status}`);
      const data = await response.json();
      resultText = data.choices[0].message.content;
    }

    // Parse the JSON returned by the model
    // Remove markdown block wraps just in case the model ignored constraints
    const cleanJsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonStr);
    
    // Safety check: ensure idA and idB exist in our memos
    const existsA = memos.some(m => m.id === parsed.idA);
    const existsB = memos.some(m => m.id === parsed.idB);

    if (existsA && existsB && parsed.idA !== parsed.idB) {
      return res.json({
        success: true,
        idA: parsed.idA,
        idB: parsed.idB,
        reason: parsed.reason
      });
    } else {
      throw new Error("Invalid IDs returned by model.");
    }

  } catch (err) {
    console.error('API Recommend Merge Failed, calling fallback picker:', err);
    const fallbackResult = runRecommendMergeSimulator(memos, lang);
    return res.json({ success: true, ...fallbackResult });
  }
});

// --------------------------------------------------------------------------
// 🧠 Secure Backend Multi-LLM API Synthesis & Prompt Engine
// --------------------------------------------------------------------------

app.post('/api/synthesize', async (req, res) => {
  const { textA, textB, customApiKey, provider, language } = req.body;

  if (!textA || !textB) {
    return res.status(400).json({ error: 'Both textA and textB are required.' });
  }

  const selectedProvider = provider || 'gemini';
  const lang = language || 'ko';
  
  // Prompt configuration specifically tuned for adaptive tone-and-manner (T&M) semantic synthesis
  let promptText = "";
  if (lang === 'en') {
    promptText = `Two different thought dewdrops have fused.
Analyze the core themes of both memos, identify the tone & manner (T&M) of their topics, and synthesize them in the most natural and optimal style.

[Memo A]: ${textA}
[Memo B]: ${textB}

[Core Tone Rules]
1. If the theme is technical/practical/scientific (e.g. IT, software, technology, science, business, academics):
   - Never use poetic descriptions, sentimental emotional expressions, or philosophical exaggerations (e.g., 'like a river meeting a rock', 'giving a soul', etc.).
   - Provide a highly clear, straightforward, realistic, and structured synthesis and actionable insight in a professional/engineering tone.
2. If the theme is creative/emotional/wellness (e.g. art, poetry, essays, meditation, daily life, wellness):
   - Utilize a warm, smooth, inspirational, and beautiful prose style to blend them harmoniously.

You MUST strictly adhere to the following markdown format and respond in English:

### Synthesized Thought
[A natural and organic integration that blends the two memos together seamlessly based on their tone (technical/practical vs creative/wellness). Avoid an artificially pasted feel, and ensure it reads like a single, high-quality, pre-written statement. Do not use bullet points or lists.]

### AI Creative Synergy
[Add a highly attractive development path, next actionable step, or creative synergy in 1-2 sentences. (For technical fields, provide specific implementation tips or architectural workarounds; for emotional fields, offer a warm, aesthetic wellness suggestion.)]`;
  } else {
    promptText = `두 가지 서로 다른 생각 메모가 융합되었습니다.
두 메모의 주제를 면밀히 분석한 후, 두 생각의 주제가 지닌 고유한 성격과 톤앤매너(Tone & Manner)를 파악하여 가장 최적의 문체로 융합해 주세요.

[메모 A]: ${textA}
[메모 B]: ${textB}

[핵심 문체 규칙]
1. 주제가 'IT/소프트웨어/기술/과학/비즈니스/학술' 등 실무적/이과형 성격인 경우:
   - 절대로 시적인 묘사, 감상적인 감성 표현, 철학적 과장(예: '두 개의 얼굴', '강물이 바위를 만나 소용돌이치듯', '오직 흐름만 남게 될 것입니다', '영혼을 불어넣는' 등)을 사용하지 마세요.
   - 매우 명료하고, 직관적이며, 사실적이고, 구조화된 실무형/엔지니어링 톤으로 융합 및 실천 방안을 제시하세요.
2. 주제가 '예술/시/에세이/명상/일상/웰니스' 등 감성적 성격인 경우:
   - 기존처럼 유려하고, 아늑하며, 영감이 피어나는 아름다운 산문 형태의 감성적 톤을 활용하여 조화롭게 다듬어 주세요.

형식은 반드시 다음 마크다운 형식을 엄격히 준수해서 한글로 출력해 주세요:

### 융합된 생각
[두 메모가 지닌 성격(기술/실무 vs 예술/웰니스)에 맞춰 가장 자연스럽고 유기적으로 녹아든 유기적인 문장 통합본. 억지로 이어붙인 느낌을 배제하고, 독자가 읽었을 때 처음부터 하나의 완성도 높은 문장으로 느껴지도록 기술하세요. 목록형이나 개조식은 금지합니다.]

### AI의 창의적 시너지
[주제에 부합하는 매력적인 발전 방향, 다음 행동 단계, 또는 창의적 시너지를 톤앤매너에 맞춘 문체로 2줄 이내로 채워 주세요. (기술 분야의 경우 구체적인 구현적 설계 팁이나 극복 방안을, 감성 분야의 경우 은은한 웰니스 제안을 제공)]`;
  }

  // 1. POETIC SIMULATOR
  if (selectedProvider === 'simulator') {
    const simulationResult = runPoeticSimulator(textA, textB, lang);
    return res.json({
      success: true,
      mode: 'simulation',
      text: simulationResult
    });
  }

  // 2. DEEPSEEK PROVIDER
  if (selectedProvider === 'deepseek') {
    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.log('No DeepSeek API Key found. Operating in poetic simulator fallback.');
      const simulationResult = runPoeticSimulator(textA, textB, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'DeepSeek API Key was missing. Substituted with offline simulator.'
      });
    }

    try {
      const url = 'https://api.deepseek.com/chat/completions';
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API responded with status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices[0].message.content;

      return res.json({
        success: true,
        mode: 'deepseek',
        text: resultText
      });
    } catch (err) {
      console.error('DeepSeek Backend API Error:', err);
      const simulationResult = runPoeticSimulator(textA, textB, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'DeepSeek API failed. Fallback to offline simulator.'
      });
    }
  }

  // 3. OPENROUTER PROVIDER
  if (selectedProvider === 'openrouter') {
    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('No OpenRouter API Key found. Operating in poetic simulator fallback.');
      const simulationResult = runPoeticSimulator(textA, textB, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'OpenRouter API Key was missing. Substituted with offline simulator.'
      });
    }

    try {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Dewdrop Canvas'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            { role: 'user', content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices[0].message.content;

      return res.json({
        success: true,
        mode: 'openrouter',
        text: resultText
      });
    } catch (err) {
      console.error('OpenRouter Backend API Error:', err);
      const simulationResult = runPoeticSimulator(textA, textB, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'OpenRouter API failed. Fallback to offline simulator.'
      });
    }
  }

  // 4. GEMINI PROVIDER (DEFAULT)
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || req.headers['x-api-key'];

  if (!apiKey) {
    console.log('No Gemini API Key found. Operating in poetic simulator fallback.');
    const simulationResult = runPoeticSimulator(textA, textB, lang);
    return res.json({
      success: true,
      mode: 'simulation',
      text: simulationResult
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const response = await (globalThis.fetch || fetch)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 550
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    return res.json({
      success: true,
      mode: 'gemini',
      text: resultText
    });

  } catch (err) {
    console.error('Gemini API Integration Error:', err);
    const simulationResult = runPoeticSimulator(textA, textB, lang);
    return res.json({
      success: true,
      mode: 'simulation_fallback',
      text: simulationResult,
      warning: 'Gemini API failed. Substituted with elegant simulated output.'
    });
  }
});

// 5. POST /api/enhance - Enhance a single memo thought securely
app.post('/api/enhance', async (req, res) => {
  const { text, customApiKey, provider, language } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required for enhancement.' });
  }

  const selectedProvider = provider || 'gemini';
  const lang = language || 'ko';
  
  let promptText = "";
  if (lang === 'en') {
    promptText = `Read the following unfinished inspiration memo, polish the context without altering the core topic, and enhance it with better vocabulary or logic into a smooth, high-quality complete single prose sentence.
Smartly analyze the tone and manner (technical/business vs creative/wellness) of the original memo and write the enhancement in a matching style.

[Original Memo]: ${text}

[Core Tone Rules]
1. If the theme is technical/practical/scientific (e.g. IT, software, technology, science, business, academics):
   - Never use poetic descriptions, sentimental emotional expressions, or philosophical exaggerations (e.g., 'like water flowing', 'dialogue of man and machine', etc.).
   - Provide a highly clear, straightforward, realistic, and structured enhancement and actionable advice in a professional/engineering tone.
2. If the theme is creative/emotional/wellness (e.g. art, poetry, essays, meditation, daily life, wellness):
   - Utilize a warm, smooth, inspirational, and beautiful prose style to blend them harmoniously.

You MUST strictly adhere to the following markdown format and respond in English:

### Enhanced Thought
[The enhanced thought, polished for sentence structure and word choice, written naturally and sophisticatedly to match its tone. Bullet points, lists, or mechanical separation lines are strictly forbidden.]

### AI Creative Synergy
[Add a specific development direction or practical tip derived from this thought in 1 sentence.]`;
  } else {
    promptText = `입력된 한 편의 미완성 영감 메모를 읽고, 핵심 주제는 훼손하지 않으면서 문맥을 깔끔하게 다듬고, 부족한 표현이나 논리를 보완하여 유려하고 완성도 높은 단일 산문 문장으로 보강해 주세요.
입력된 메모의 톤앤매너(IT/과학/기술/비즈니스 vs 문학/웰니스/일상)를 스마트하게 스스로 파악하여 어울리는 최적의 문체로 보강해 주세요.

[원본 메모]: ${text}

[핵심 문체 규칙]
1. 주제가 'IT/소프트웨어/기술/과학/비즈니스/학술' 등 실무적/이과형 성격인 경우:
   - 절대로 시적인 묘사, 감상적인 감성 표현, 철학적 과장(예: '물이 흐르듯', '인간과 기계의 대화', '두 개의 얼굴' 등)을 사용하지 마세요.
   - 매우 명료하고, 직관적이며, 사실적이고, 구조화된 실무형/엔지니어링 톤으로 보강하고 실천 방안을 제시하세요.
2. 주제가 '예술/시/에세이/명상/일상/웰니스' 등 감성적 성격인 경우:
   - 유려하고, 아늑하며, 영감이 피어나는 아름다운 산문 형태의 감성적 톤을 활용하여 조화롭게 다듬어 주세요.

형식은 반드시 다음 마크다운 형식을 엄격히 준수해서 한글로 출력해 주세요:

### 보강된 생각
[주제 성격에 부합하도록 문장 구조와 단어 선택을 다듬고 묘사를 보완하여 자연스럽고 세련되게 작성한 통합 생각. 기계적인 구분선이나 개조식, 목록형 서술은 절대 금지합니다.]

### AI의 창의적 시너지
[이 생각에서 파생될 수 있는 구체적인 발전 방향 또는 실천적 팁을 톤앤매너에 맞추어 1줄로 덧붙여 주세요.]`;
  }

  // 1. POETIC SINGLE ENHANCE SIMULATOR
  if (selectedProvider === 'simulator') {
    const simulationResult = runPoeticSingleEnhance(text, lang);
    return res.json({
      success: true,
      mode: 'simulation',
      text: simulationResult
    });
  }

  // 2. DEEPSEEK PROVIDER
  if (selectedProvider === 'deepseek') {
    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.log('No DeepSeek API Key found for enhance. Operating in simulator fallback.');
      const simulationResult = runPoeticSingleEnhance(text, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'DeepSeek API Key was missing. Substituted with offline simulator.'
      });
    }

    try {
      const url = 'https://api.deepseek.com/chat/completions';
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API responded with status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices[0].message.content;

      return res.json({
        success: true,
        mode: 'deepseek',
        text: resultText
      });
    } catch (err) {
      console.error('DeepSeek Enhance API Error:', err);
      const simulationResult = runPoeticSingleEnhance(text, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult
      });
    }
  }

  // 3. OPENROUTER PROVIDER
  if (selectedProvider === 'openrouter') {
    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('No OpenRouter API Key found for enhance. Operating in simulator fallback.');
      const simulationResult = runPoeticSingleEnhance(text, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult,
        warning: 'OpenRouter API Key was missing. Substituted with offline simulator.'
      });
    }

    try {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      
      const response = await (globalThis.fetch || fetch)(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Dewdrop Canvas'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            { role: 'user', content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices[0].message.content;

      return res.json({
        success: true,
        mode: 'openrouter',
        text: resultText
      });
    } catch (err) {
      console.error('OpenRouter Enhance API Error:', err);
      const simulationResult = runPoeticSingleEnhance(text, lang);
      return res.json({
        success: true,
        mode: 'simulation_fallback',
        text: simulationResult
      });
    }
  }

  // 4. GEMINI PROVIDER (DEFAULT)
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || req.headers['x-api-key'];

  if (!apiKey) {
    console.log('No Gemini API Key found for enhance. Operating in simulator fallback.');
    const simulationResult = runPoeticSingleEnhance(text, lang);
    return res.json({
      success: true,
      mode: 'simulation',
      text: simulationResult
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const response = await (globalThis.fetch || fetch)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 550
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    return res.json({
      success: true,
      mode: 'gemini',
      text: resultText
    });

  } catch (err) {
    console.error('Gemini Enhance API Error:', err);
    const simulationResult = runPoeticSingleEnhance(text, lang);
    return res.json({
      success: true,
      mode: 'simulation_fallback',
      text: simulationResult
    });
  }
});

// Poetic Simulator for Single Thought Enhancement
function runPoeticSingleEnhance(text, lang = 'ko') {
  if (lang === 'en') {
    const cleanText = text.toLowerCase();
    let topic = "idea";
    if (cleanText.includes('rain') || cleanText.includes('water')) topic = "cozy soundscapes and wellness resonance";
    else if (cleanText.includes('fire') || cleanText.includes('wood')) topic = "visual warmth and crackling fire textures";
    else if (cleanText.includes('wind') || cleanText.includes('forest')) topic = "whispering leaves and high-frequency relaxation wind cues";
    
    return `### Enhanced Thought
${text.trim()} And the subtle acoustic depth nurtured in this space doesn't merely stimulate hearing; it gently awakens senses dulled by daily routine, naturally weaving a bridge to organic inner restoration.

### AI Creative Synergy
I suggest immediate application of this ${topic} to a pomodoro focus timer or personal meditation layout to manifest it as a tactile tool.`;
  }

  const cleanText = text.toLowerCase();
  let topic = "아이디어";
  if (cleanText.includes('비') || cleanText.includes('빗소리')) topic = "빗소리와 비 오는 날의 웰니스 감성";
  else if (cleanText.includes('장작') || cleanText.includes('모닥불')) topic = "모닥불 and 타오르는 따스한 시각 질감";
  else if (cleanText.includes('바람') || cleanText.includes('숲')) topic = "나뭇잎 서걱이는 바람의 고주파 이완 효과";
  
  return `### 보강된 생각
${text.trim()} 그리고 이 공간이 품고 있는 은밀한 청각적 깊이는, 단순히 귀로 듣는 자극을 넘어 바쁜 일상에서 무뎌진 마음의 감각을 깨우고 내면을 차분하게 정돈해 주는 오가닉 치유의 통로로 자연스럽게 스며듭니다.

### AI의 창의적 시너지
해당 ${topic}를 뽀모도로 작업 타이머 또는 1인 숲속 명상 앱 디자인에 바로 투영하여 감성적 실천 도구로 구체화해 보기를 제안합니다.`;
}

// --------------------------------------------------------------------------
// 🤖 Elegant Poetic Semantic Fallback
// --------------------------------------------------------------------------

function runPoeticSimulator(textA, textB, lang = 'ko') {
  if (lang === 'en') {
    const cleanA = textA.toLowerCase();
    const cleanB = textB.toLowerCase();
    
    let isRain = cleanA.includes('rain') || cleanB.includes('rain') || cleanA.includes('water') || cleanB.includes('water') || cleanA.includes('비') || cleanB.includes('비');
    let isFire = cleanA.includes('fire') || cleanB.includes('fire') || cleanA.includes('wood') || cleanB.includes('wood') || cleanA.includes('장작') || cleanB.includes('장작');
    let isWind = cleanA.includes('wind') || cleanB.includes('wind') || cleanA.includes('forest') || cleanB.includes('forest') || cleanA.includes('바람') || cleanB.includes('바람');
    
    let merged = "";
    let enhanced = "";
    
    if (isRain && isFire) {
      merged = "The absolute spatial coziness arising from the dry crackling sound of firewood inside a cabin fireplace balanced against the cold raindrops tapping on the window glass.";
      enhanced = "The dry sound profile of fireplace embers and the wet liquid textures of rain create an acoustic symmetry. Blending this with a 2.5Hz non-linear candle flickering light can decrease stress levels by up to 18%.";
    } else if (isRain && isWind) {
      merged = "A dynamic synchronization between the steady rhythm of rain tapping the cabin roof and the distant whispering sway of wind through the forest leaves.";
      enhanced = "To prevent the 4000Hz pink noise of leaves from masking the rain patter, applying a real-time LFO signal to dynamically modulate rain density based on wind speed will maximize immersion.";
    } else if (isFire && isWind) {
      merged = "An organic harmony between the creaks of tall forest trees swaying in the wind and the randomized flickering of hearth fire flames.";
      enhanced = "Filling the hollow echo of wind with a deep fireplace bass rumble and adding random cabin creaks creates a secure mental haven, simulating a protective cabin sanctuary.";
    } else {
      const nounsA = extractNouns(textA);
      const nounsB = extractNouns(textB);
      const combinedNouns = [...new Set([...nounsA, ...nounsB])].slice(0, 4).join(', ');
      
      merged = `A comprehensive thought structure mapping the intuitive inspiration of '${textA.substring(0, 16)}...' and details of '${textB.substring(0, 16)}...' under themes of ${combinedNouns || 'creative ideas'}.`;
      enhanced = `Bridging the conceptual gap between these points and projecting them into a pomodoro work focus layout or customized wellness soundscapes will yield immediate utility.`;
    }
    
    return `### Synthesized Thought\n${merged}\n\n### AI Creative Synergy\n${enhanced}`;
  }

  const cleanA = textA.toLowerCase();
  const cleanB = textB.toLowerCase();
  
  let isRain = cleanA.includes('비') || cleanB.includes('비') || cleanA.includes('빗소리') || cleanB.includes('빗소리');
  let isFire = cleanA.includes('장작') || cleanB.includes('장작') || cleanA.includes('모닥불') || cleanB.includes('모닥불') || cleanA.includes('불꽃') || cleanB.includes('불꽃');
  let isWind = cleanA.includes('바람') || cleanB.includes('바람') || cleanA.includes('나뭇잎') || cleanB.includes('나뭇잎') || cleanA.includes('숲') || cleanB.includes('숲');
  
  let merged = "";
  let enhanced = "";
  
  if (isRain && isFire) {
    merged = "참나무 장작이 타닥타닥 타오르며 건조하게 터지는 오두막 벽난로의 아늑함과, 외부 창문을 똑똑 두드리며 차갑게 흘러내리는 빗줄기 소리를 입체적으로 대칭 결합한 극한의 공간적 아늑함.";
    enhanced = "실내 장작이 주는 100% 무수분 상태의 고열 건조 질감과 외부 빗방울의 촉촉한 액체 음향이 청각적 완벽한 조화를 이루며, 2.5Hz 비선형 플리커 촛불 광원과 결합 시 심리적 스트레스를 최고 18% 이상 감소시키는 정서적 테라피 효과로 발전할 수 있습니다.";
  } else if (isRain && isWind) {
    merged = "회색빛 비구름 아래 아늑하게 갇힌 오두막 처마 밑으로 떨어지는 차분한 빗소리와, 숲길을 따라 멀리 나뭇잎들이 서걱이며 흔들리는 바람 소리의 역동적 흐름 동기화.";
    enhanced = "나뭇잎 서걱임의 4000Hz 고대역 핑크 노이즈와 빗방울의 밴드패스 타격음이 음향적으로 마스킹되는 것을 방지하기 위해, 바람의 크기에 따라 빗방울 밀도를 실시간 LFO 신호로 펄스 변조하는 음향적 엔지니어링을 가미하면 몰입 효율을 극대화할 수 있습니다.";
  } else if (isFire && isWind) {
    merged = "바람이 거세게 불 때마다 숲속 가문비나무 기둥이 흔들리며 삐걱거리는 고목의 웅장함과, 방 안에서 이글거리며 흔들리는 불꽃의 무작위 흔들림(LFO)이 이룩하는 오가닉 힐링.";
    enhanced = "바람소리의 공허한 우울감을 모닥불의 깊은 Rumble 저역대로 채우고, 10초 주기의 무작위 나무 기둥 비빔음(Creaks)을 가미하여 마치 깊은 원시림 속에 완전히 보호받는 방패막을 형성하는 심리적 안전 영역을 구축해 줄 수 있습니다.";
  } else {
    const nounsA = extractNouns(textA);
    const nounsB = extractNouns(textB);
    const combinedNouns = [...new Set([...nounsA, ...nounsB])].slice(0, 4).join(', ');
    
    merged = `[${combinedNouns}] 등을 모티프로 하여, 파편화되어 존재하던 '${textA.substring(0, 16)}...'의 직관적 영감과 '${textB.substring(0, 16)}...'의 세부 묘사를 결합하여 깊은 정서적 통찰을 직조하는 하나의 완성된 생각 가치 체계.`;
    enhanced = `두 생각의 접점인 ${combinedNouns || '아이디어'} 사이의 개념적 공백을 짚어보고, 이를 실생활 뽀모도로 몰입 타이머 및 맞춤형 앰비언트 웰니스 기능에 즉각적으로 투영하여 구체적인 작업 생산성 도구로 확장 및 실천해 나갈 가치가 충분합니다.`;
  }
  
  return `### 융합된 생각\n${merged}\n\n### AI의 창의적 시너지\n${enhanced}`;
}

// Heuristic recommend picker simulator
function runRecommendMergeSimulator(memos, lang = 'ko') {
  if (memos.length < 2) return { idA: '', idB: '', reason: '' };
  
  // Try to find two matching concepts:
  // E.g. find one containing water/rain and one containing fire/embers
  let idxA = 0;
  let idxB = 1;
  let found = false;

  for (let i = 0; i < memos.length; i++) {
    for (let j = i + 1; j < memos.length; j++) {
      const txtA = memos[i].text.toLowerCase();
      const txtB = memos[j].text.toLowerCase();
      
      const hasRainA = txtA.includes('비') || txtA.includes('rain') || txtA.includes('water');
      const hasFireB = txtB.includes('장작') || txtB.includes('fire') || txtB.includes('wood');
      const hasRainB = txtB.includes('비') || txtB.includes('rain') || txtB.includes('water');
      const hasFireA = txtA.includes('장작') || txtA.includes('fire') || txtA.includes('wood');
      
      if ((hasRainA && hasFireB) || (hasFireA && hasRainB)) {
        idxA = i;
        idxB = j;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  const mA = memos[idxA];
  const mB = memos[idxB];
  
  let reason = "";
  if (lang === 'en') {
    reason = `Offline Simulator matched '${mA.text.substring(0, 15)}...' and '${mB.text.substring(0, 15)}...' to unite warm fire crackles and liquid rainy acoustic dynamics.`;
  } else {
    reason = `오프라인 시뮬레이터가 '${mA.text.substring(0, 15)}...'과 '${mB.text.substring(0, 15)}...'을 결합하여 따스한 장작 소리와 촉촉한 빗소리의 조화로운 아쿠스틱 음향 대비를 매칭했습니다.`;
  }

  return {
    idA: mA.id,
    idB: mB.id,
    reason: reason
  };
}

function extractNouns(text) {
  const keywords = ['장작', '비', '바람', '나뭇잎', '숲', '모닥불', '소리', '아이디어', '생각', '도구', '웰니스', '집중', '휴식', '음악', '메모', 'rain', 'fire', 'wind', 'forest', 'wood', 'sound', 'idea', 'wellness', 'focus', 'rest', 'music', 'memo'];
  return keywords.filter(word => text.toLowerCase().includes(word));
}

// --------------------------------------------------------------------------
// 🚀 Launch Express Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`💧 Dewdrop Canvas Web Service Running on Localhost!`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
