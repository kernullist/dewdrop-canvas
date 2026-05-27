/* ==========================================================================
   Dewdrop Canvas - Core Fluid Physics & AI Synthesis Engine
   ========================================================================== */

// 1. App State & Physics Configurations
let memos = [];
let draggingMemo = null;
let mouseX = 0;
let mouseY = 0;
let activeContextMemo = null;

// New Web Service, Project & History states
let undoStack = [];
let lastMergedIds = [];
let currentProjectId = null;
let currentProjectTitle = '';
let autoSaveTimeout = null;

// Modal dynamic control state
let modalMode = 'create'; // 'create' or 'rename'
let renameTargetProjectId = null;

// Multi-language Translation Support
let currentLanguage = localStorage.getItem('dewdrop_language') || 'ko';

const I18N_DICTIONARY = {
  ko: {
    appTitle: "Dewdrop Canvas (듀드롭 캔버스) - 물방울 생각 융합 보드",
    dropSectionTitle: "생각 물방울 떨어뜨리기",
    memoInputPlaceholder: "머릿속의 작은 아이디어를 여기에 적어보세요... (예: 마른 장작 타는 소리가 아늑해)",
    createDropletBtn: "물방울 생성",
    aiSectionTitle: "AI 지능 융합 설정",
    aiSectionDesc: "물방울을 겹칠 때 통합 메모를 자동 생성할 인공지능 모델 및 공급자를 설정합니다.",
    providerGemini: "Gemini 1.5 Flash (기본)",
    providerDeepseek: "DeepSeek Chat (자연스러움 특화)",
    providerOpenrouter: "OpenRouter (DeepSeek Chat)",
    providerSimulator: "Poetic Simulator (오프라인)",
    placeholderGemini: "Gemini API Key (공란 시 서버 설정 사용)",
    placeholderDeepseek: "DeepSeek API Key (공란 시 서버 설정 사용)",
    placeholderOpenrouter: "OpenRouter API Key (공란 시 서버 설정 사용)",
    placeholderSimulator: "Simulation Mode (API Key 필요 없음)",
    statusChecking: "서버 설정 확인 중...",
    statusSimulation: "Simulation Mode (오프라인 가동)",
    statusConnectedServer: "서버 {providerName} 키 자동 연동 완료",
    statusNoServerKey: "서버에 {providerName} 키가 없습니다 (개별 입력 가능)",
    statusServerDelay: "서버 연결 지연 (Simulation 대체 가동)",
    statusConnectedCustom: "개별 {providerName} 키 연동 중",
    projectSectionTitle: "프로젝트 목록",
    addProjectBtn: "추가",
    projectsLoading: "불러오는 중...",
    emptyCanvases: "프로젝트가 존재하지 않습니다.",
    historySectionTitle: "생각 융합 역사 (History)",
    emptyHistory: "물방울을 겹쳐서 첫 번째 생각의 융합을 일으켜보세요.",
    statusBadgeText: "물리 기반 유체 캔버스 가동 중",
    undoBtnTitle: "되돌리기 (Ctrl + Z)",
    clearCanvasBtnTitle: "캔버스 전체 비우기",
    floatingTips: "생각 물방울을 드래그해 가까이 가져가면 쫀득하게 합쳐지며 AI 요약이 시작됩니다. (되돌리려면 Ctrl+Z 또는 상단 되돌리기 버튼 클릭)",
    synthesisTitle: "생각의 물방울 융합 중",
    synthesisDesc: "두 생각의 접점을 추출하고 부족한 부분을 분석하여 완벽한 하나의 생각으로 정돈하고 보완하고 있습니다...",
    stepExtract: "두 메모 핵심 개념 추출 중",
    stepSynthesis: "논리적 합치 및 중복 배제 요약 중",
    stepEnhance: "AI 보완 분석 및 논리 확장 중",
    ctxEnhance: "AI 생각 보강 & 정돈",
    ctxDelete: "생각 물방울 터뜨리기",
    modalCreateTitle: "새 프로젝트 등록",
    modalCreateDesc: "마인드맵 프로젝트의 이름을 입력해 주세요. 새로운 독립된 물리 생각 공간이 생성됩니다.",
    modalCreatePlaceholder: "예: 우주 물리학 아이디어 지도",
    modalCreateConfirm: "등록하기",
    modalCancel: "취소",
    modalRenameTitle: "프로젝트 이름 변경",
    modalRenameDesc: "마인드맵 프로젝트의 새로운 이름을 입력하세요.",
    modalRenamePlaceholder: "예: 새 프로젝트 이름",
    modalRenameConfirm: "변경하기",
    memoDetailTitle: "생각 물방울 들여다보기",
    memoDetailDesc: "이 물방울에 담긴 생각의 원문을 들여다보고 자유롭게 수정하거나 보완해 보세요.",
    memoDetailDelete: "터뜨리기",
    memoDetailCancel: "닫기",
    memoDetailSave: "저장하기",
    toastPopped: "생각 물방울을 터뜨렸습니다.",
    toastInputNeeded: "생각 메모의 내용을 입력해 주세요.",
    toastUpdated: "생각 물방울 내용을 수정했습니다.",
    toastUndo: "되돌리기",
    toastEnhancedSuccess: "{providerName} 모델이 생각을 보강하고 말끔하게 정돈했습니다.",
    toastEnhancedFail: "통신 에러로 인해 생각을 보강하지 못했습니다.",
    toastClearConfirm: "캔버스의 모든 생각 물방울을 비우시겠습니까?",
    toastCleared: "캔버스를 완전히 비웠습니다.",
    toastProjectLoaded: "'{title}' 프로젝트 작업 공간을 불렀습니다.",
    toastProjectSwitched: "'{title}' 프로젝트로 전환했습니다.",
    toastProjectCreated: "새 프로젝트 '{title}'을 등록하여 열었습니다.",
    toastProjectDeleteConfirm: "이 마인드맵 프로젝트와 내부 물방울 메모들을 완전히 삭제하시겠습니까?",
    toastProjectDeleted: "프로젝트가 영구적으로 삭제되었습니다.",
    toastProjectDeleteFail: "프로젝트 삭제에 실패했습니다.",
    toastProjectRenamed: "프로젝트명을 '{title}'으로 변경했습니다.",
    toastProjectRenameFail: "프로젝트 이름 변경에 실패했습니다.",
    toastProjectInputNeeded: "프로젝트 이름을 입력해 주세요.",
    toastSynthesisGemini: "Gemini가 두 메모를 유기적으로 융합했습니다.",
    toastSynthesisDeepseek: "DeepSeek가 생각을 물 흐르듯 유려하게 융합했습니다.",
    toastSynthesisOpenrouter: "OpenRouter(DeepSeek) 모델이 자연스러운 통합을 마쳤습니다.",
    toastSynthesisFallback: "API 오류로 인해 오프라인 융합 지능이 대체 가동되었습니다.",
    toastSynthesisSimulator: "오프라인 시뮬레이션 지능으로 융합을 완료했습니다.",
    toastSynthesisFallbackMerge: "통신 에러로 인해 안전 모드 병합을 처리했습니다.",
    toastRolledBack: "이전 생각 상태로 되돌렸습니다.",
    toastPopConfirm: "이 생각 물방울을 정말 터뜨려 삭제하시겠습니까?",
    toastLimitReached: "캔버스 공간이 가득 찼습니다. 기존 물방울을 융합하거나 터뜨려 공간을 확보해 주세요. (최대 {max}개)",
    exportModalTitle: "마크다운 생각 내보내기",
    exportModalDesc: "현재 캔버스의 활성화된 생각들을 정돈된 마크다운 문서로 편집하고 파일로 다운로드하거나 복사할 수 있습니다.",
    exportModalCopy: "복사하기",
    exportModalDownload: "다운로드",
    exportModalClose: "닫기",
    toastExportCopied: "마크다운 문서가 클립보드에 복사되었습니다.",
    toastExportEmpty: "내보낼 생각이 존재하지 않습니다.",
    exportBtnTitle: "마크다운으로 내보내기",
    clearHistoryBtnTitle: "융합 역사 비우기",
    clearHistoryBtnSpan: "비우기",
    toastClearHistoryConfirm: "생각 융합 역사 기록을 모두 비우시겠습니까?",
    toastHistoryCleared: "생각 융합 역사를 완전히 비웠습니다.",
    settingsTitle: "설정",
    settingsDesc: "언어 환경 설정을 구성할 수 있습니다.",
    settingsLangLabel: "표시 언어 / Display Language",
    settingsCloseBtn: "닫기",
    aiAutoMergeBtnTitle: "AI 자동 추천 융합 (AI Auto-Merge)",
    toastMinMemosRequired: "AI 추천 융합을 시작하려면 최소 2개 이상의 생각 물방울이 필요합니다.",
    toastAutoMergeAnalyzing: "AI가 현재 캔버스의 모든 생각을 분석하여 최적의 융합 대상을 고르는 중입니다...",
    toastAutoMergeSnapped: "AI가 시너지가 뛰어난 두 생각을 발견했습니다! 자석처럼 끌어당겨 합칩니다.",
    toastAutoMergeFail: "AI 추천 융합 대상을 선정하는 데 실패했습니다.",
  },
  en: {
    appTitle: "Dewdrop Canvas - Liquid Thought Synthesis Board",
    dropSectionTitle: "Drop Thought Dewdrops",
    memoInputPlaceholder: "Write down a tiny idea in your mind... (e.g. The sound of crackling firewood is cozy)",
    createDropletBtn: "Create Dewdrop",
    aiSectionTitle: "AI Intelligence Fusion Settings",
    aiSectionDesc: "Configure the AI model and provider to automatically synthesize overlapping dewdrops.",
    providerGemini: "Gemini 1.5 Flash (Default)",
    providerDeepseek: "DeepSeek Chat (Natural Text Spec)",
    providerOpenrouter: "OpenRouter (DeepSeek Chat)",
    providerSimulator: "Poetic Simulator (Offline)",
    placeholderGemini: "Gemini API Key (Leave blank to use server setting)",
    placeholderDeepseek: "DeepSeek API Key (Leave blank to use server setting)",
    placeholderOpenrouter: "OpenRouter API Key (Leave blank to use server setting)",
    placeholderSimulator: "Simulation Mode (No API Key Required)",
    statusChecking: "Checking server settings...",
    statusSimulation: "Simulation Mode (Offline)",
    statusConnectedServer: "Server {providerName} Key Auto-linked",
    statusNoServerKey: "No {providerName} key on server (Enter custom key)",
    statusServerDelay: "Server connection delayed (Simulation fallback active)",
    statusConnectedCustom: "Custom {providerName} Key linked",
    projectSectionTitle: "Projects",
    addProjectBtn: "Add",
    projectsLoading: "Loading...",
    emptyCanvases: "No projects exist.",
    historySectionTitle: "Thought Fusion History",
    emptyHistory: "Overlap dewdrops to spark your first thought fusion.",
    statusBadgeText: "Physics Fluid Canvas Active",
    undoBtnTitle: "Undo (Ctrl + Z)",
    clearCanvasBtnTitle: "Clear Canvas",
    floatingTips: "Drag thought dewdrops close to fuse them smoothly and start AI synthesis. (Press Ctrl+Z or click Undo to revert)",
    synthesisTitle: "Fusing Thought Dewdrops",
    synthesisDesc: "Extracting the intersection of both thoughts and analyzing missing parts to organize and enhance them into one complete thought...",
    stepExtract: "Extracting core concepts",
    stepSynthesis: "Synthesizing and summarizing logically",
    stepEnhance: "Analyzing enhancements and extending logic",
    ctxEnhance: "AI Thought Enhance & Clean",
    ctxDelete: "Pop Thought Dewdrop",
    modalCreateTitle: "Create New Project",
    modalCreateDesc: "Enter the name of your project. A new independent physical thought workspace will be created.",
    modalCreatePlaceholder: "e.g., Space Physics Idea Map",
    modalCreateConfirm: "Register",
    modalCancel: "Cancel",
    modalRenameTitle: "Rename Project",
    modalRenameDesc: "Enter the new name for the project.",
    modalRenamePlaceholder: "e.g., New project name",
    modalRenameConfirm: "Rename",
    memoDetailTitle: "Examine Thought Dewdrop",
    memoDetailDesc: "Examine the original thought inside this dewdrop and freely edit or enhance it.",
    memoDetailDelete: "Pop Dewdrop",
    memoDetailCancel: "Close",
    memoDetailSave: "Save",
    toastPopped: "Popped thought dewdrop.",
    toastInputNeeded: "Please enter the thought content.",
    toastUpdated: "Updated thought dewdrop content.",
    toastUndo: "Undo",
    toastEnhancedSuccess: "{providerName} enhanced and refined the thought.",
    toastEnhancedFail: "Failed to enhance thought due to network error.",
    toastClearConfirm: "Are you sure you want to clear all thought dewdrops on the canvas?",
    toastCleared: "Fully cleared the canvas.",
    toastProjectLoaded: "Loaded project workspace '{title}'.",
    toastProjectSwitched: "Switched to project '{title}'.",
    toastProjectCreated: "Registered and opened new project '{title}'.",
    toastProjectDeleteConfirm: "Are you sure you want to permanently delete this project and all its internal thought dewdrops?",
    toastProjectDeleted: "Project permanently deleted.",
    toastProjectDeleteFail: "Failed to delete project.",
    toastProjectRenamed: "Renamed project to '{title}'.",
    toastProjectRenameFail: "Failed to rename project.",
    toastProjectInputNeeded: "Please enter a project name.",
    toastSynthesisGemini: "Gemini organically fused both memos.",
    toastSynthesisDeepseek: "DeepSeek fluidly fused both thoughts.",
    toastSynthesisOpenrouter: "OpenRouter(DeepSeek) completed natural integration.",
    toastSynthesisFallback: "Offline fusion intelligence active due to API error.",
    toastSynthesisSimulator: "Completed fusion using offline simulation.",
    toastSynthesisFallbackMerge: "Processed safe-mode merge due to network error.",
    toastRolledBack: "Undid to the previous thought state.",
    toastPopConfirm: "Are you sure you want to pop and delete this thought dewdrop?",
    toastLimitReached: "The canvas space is full. Please fuse or pop existing dewdrops to free up space. (Max {max})",
    exportModalTitle: "Export Thoughts to Markdown",
    exportModalDesc: "Edit and export the active thoughts on your canvas as a structured Markdown document.",
    exportModalCopy: "Copy",
    exportModalDownload: "Download",
    exportModalClose: "Close",
    toastExportCopied: "Markdown document copied to clipboard.",
    toastExportEmpty: "No thoughts exist to export.",
    exportBtnTitle: "Export to Markdown",
    clearHistoryBtnTitle: "Clear Fusion History",
    clearHistoryBtnSpan: "Clear",
    toastClearHistoryConfirm: "Are you sure you want to clear all thought fusion history logs?",
    toastHistoryCleared: "Fully cleared thought fusion history.",
    settingsTitle: "Settings",
    settingsDesc: "Configure language and general preferences.",
    settingsLangLabel: "Display Language",
    settingsCloseBtn: "Close",
    aiAutoMergeBtnTitle: "AI Auto-Merge Selection",
    toastMinMemosRequired: "At least 2 thought dewdrops are required to start AI auto-merge.",
    toastAutoMergeAnalyzing: "AI is analyzing all thoughts on the canvas to select the best pair...",
    toastAutoMergeSnapped: "AI found a synergistic match! Magnetically pulling them together.",
    toastAutoMergeFail: "Failed to pick thought dewdrops for AI auto-merge.",
  }
};

function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('dewdrop_language', lang);
  
  const dict = I18N_DICTIONARY[lang];
  if (!dict) return;
  
  // 1. Static sidebars & text contents
  document.title = dict.appTitle;
  
  const dropSectionTitle = document.getElementById('drop-section-title');
  if (dropSectionTitle) dropSectionTitle.textContent = dict.dropSectionTitle;
  
  const memoInput = document.getElementById('memo-input');
  if (memoInput) memoInput.placeholder = dict.memoInputPlaceholder;
  
  const addMemoBtn = document.getElementById('add-memo-btn');
  if (addMemoBtn) {
    addMemoBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      ${dict.createDropletBtn}
    `;
  }
  
  const aiSectionTitle = document.getElementById('ai-section-title');
  if (aiSectionTitle) aiSectionTitle.textContent = dict.aiSectionTitle;
  
  const aiSectionDesc = document.getElementById('ai-section-desc');
  if (aiSectionDesc) aiSectionDesc.textContent = dict.aiSectionDesc;
  
  // Update AI provider select options
  const aiProviderSelect = document.getElementById('ai-provider-select');
  if (aiProviderSelect) {
    const originalValue = aiProviderSelect.value;
    aiProviderSelect.innerHTML = `
      <option value="gemini">${dict.providerGemini}</option>
      <option value="deepseek">${dict.providerDeepseek}</option>
      <option value="openrouter">${dict.providerOpenrouter}</option>
      <option value="simulator">${dict.providerSimulator}</option>
    `;
    aiProviderSelect.value = originalValue;
  }
  
  const projectSectionTitle = document.getElementById('project-section-title');
  if (projectSectionTitle) projectSectionTitle.textContent = dict.projectSectionTitle;
  
  const saveCanvasBtn = document.getElementById('save-canvas-btn');
  if (saveCanvasBtn) {
    saveCanvasBtn.title = dict.modalCreateTitle;
    const saveCanvasSpan = saveCanvasBtn.querySelector('span');
    if (saveCanvasSpan) saveCanvasSpan.textContent = dict.addProjectBtn;
  }
  
  const historySectionTitle = document.getElementById('history-section-title');
  if (historySectionTitle) historySectionTitle.textContent = dict.historySectionTitle;
  
  // Empty history fallback translation if empty
  const emptyHistory = document.querySelector('.empty-history');
  if (emptyHistory) {
    emptyHistory.textContent = dict.emptyHistory;
  }
  
  // Status badge text
  const statusBadgeSpan = document.querySelector('.status-badge span');
  if (statusBadgeSpan) statusBadgeSpan.textContent = dict.statusBadgeText;
  
  // Header buttons tooltips
  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) undoBtn.title = dict.undoBtnTitle;
  
  const clearCanvasBtn = document.getElementById('clear-canvas-btn');
  if (clearCanvasBtn) clearCanvasBtn.title = dict.clearCanvasBtnTitle;
  
  // Tips text
  const tipsSpan = document.querySelector('.floating-tips span');
  if (tipsSpan) tipsSpan.textContent = dict.floatingTips;
  
  // Modals & Details
  const settingsModalTitle = document.getElementById('settings-modal-title');
  if (settingsModalTitle) settingsModalTitle.textContent = dict.settingsTitle;
  
  const settingsModalDesc = document.getElementById('settings-modal-desc');
  if (settingsModalDesc) settingsModalDesc.textContent = dict.settingsDesc;
  
  const settingsLangLabel = document.getElementById('settings-lang-label');
  if (settingsLangLabel) settingsLangLabel.textContent = dict.settingsLangLabel;
  
  const settingsModalClose = document.getElementById('settings-modal-close');
  if (settingsModalClose) settingsModalClose.textContent = dict.settingsCloseBtn;
  
  const aiAutoMergeBtn = document.getElementById('ai-auto-merge-btn');
  if (aiAutoMergeBtn) aiAutoMergeBtn.title = dict.aiAutoMergeBtnTitle;
  
  // Memo Detail Modal
  const memoDetailTitle = document.querySelector('#memo-detail-overlay .save-modal-title');
  if (memoDetailTitle) memoDetailTitle.textContent = dict.memoDetailTitle;
  
  const memoDetailDesc = document.querySelector('#memo-detail-overlay .save-modal-desc');
  if (memoDetailDesc) memoDetailDesc.textContent = dict.memoDetailDesc;
  
  const memoDetailDelete = document.getElementById('memo-detail-delete');
  if (memoDetailDelete) {
    const span = memoDetailDelete.querySelector('span');
    if (span) span.textContent = dict.memoDetailDelete;
  }
  
  const memoDetailCancel = document.getElementById('memo-detail-cancel');
  if (memoDetailCancel) memoDetailCancel.textContent = dict.memoDetailCancel;
  
  const memoDetailSave = document.getElementById('memo-detail-save');
  if (memoDetailSave) memoDetailSave.textContent = dict.memoDetailSave;
  
  // Context Menu items
  const ctxEnhanceBtn = document.getElementById('ctx-enhance-btn');
  if (ctxEnhanceBtn) {
    ctxEnhanceBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      ${dict.ctxEnhance}
    `;
  }
  
  const ctxDeleteBtn = document.getElementById('ctx-delete-btn');
  if (ctxDeleteBtn) {
    ctxDeleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      ${dict.ctxDelete}
    `;
  }

  // Synthesis overlay items
  const synthesisTitle = document.querySelector('.synthesis-title');
  if (synthesisTitle) synthesisTitle.textContent = dict.synthesisTitle;

  const synthesisDesc = document.querySelector('.synthesis-desc');
  if (synthesisDesc) synthesisDesc.textContent = dict.synthesisDesc;

  const stepExtractSpan = document.querySelector('#step-extract span');
  if (stepExtractSpan) stepExtractSpan.textContent = dict.stepExtract;

  const stepSynthesisSpan = document.querySelector('#step-synthesis span');
  if (stepSynthesisSpan) stepSynthesisSpan.textContent = dict.stepSynthesis;

  const stepEnhanceSpan = document.querySelector('#step-enhance span');
  if (stepEnhanceSpan) stepEnhanceSpan.textContent = dict.stepEnhance;

  // Markdown Export Modal UI dynamic translation
  const exportBtn = document.getElementById('export-markdown-btn');
  if (exportBtn) exportBtn.title = dict.exportBtnTitle;

  const exportModalTitle = document.getElementById('export-modal-title');
  if (exportModalTitle) exportModalTitle.textContent = dict.exportModalTitle;

  const exportModalDesc = document.getElementById('export-modal-desc');
  if (exportModalDesc) exportModalDesc.textContent = dict.exportModalDesc;

  const exportCopySpan = document.getElementById('export-copy-btn-text');
  if (exportCopySpan) exportCopySpan.textContent = dict.exportModalCopy;

  const exportDownloadSpan = document.getElementById('export-download-btn-text');
  if (exportDownloadSpan) exportDownloadSpan.textContent = dict.exportModalDownload;

  const exportCloseBtn = document.getElementById('export-markdown-close');
  if (exportCloseBtn) exportCloseBtn.textContent = dict.exportModalClose;

  // Clear History Button dynamic translation
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) clearHistoryBtn.title = dict.clearHistoryBtnTitle;

  const clearHistorySpan = document.getElementById('clear-history-span');
  if (clearHistorySpan) clearHistorySpan.textContent = dict.clearHistoryBtnSpan;
  
  // Make sure settings select matches currentLanguage
  const settingsLanguageSelect = document.getElementById('settings-language-select');
  if (settingsLanguageSelect) settingsLanguageSelect.value = lang;
  
  // Re-sync API settings placeholder/status text since it relies on language
  if (typeof updateApiStatusText === 'function') {
    updateApiStatusText();
  }
}

const PHYSICS_CONFIG = {
  friction: 0.85,
  springDamp: 0.15,
  snapBuffer: 30, // threshold beyond radius to start gravitational pull
  minMergeRatio: 0.48 // distance ratio to trigger snap-merge
};

// 2. Procedural Audio Synthesis Engine (Web Audio API)
let audioCtx = null;

function initAudioCtx() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
}

// Organic Water Drop "Plop!" Sound
function playPlopSound() {
  initAudioCtx();
  try {
    const now = audioCtx.currentTime;
    
    // Base liquid bubble bubble sound
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
    
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.35, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    
    osc.start(now);
    osc.stop(now + 0.18);
    
    // Brittle surface tension snap "click"
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1600, now);
    clickOsc.frequency.linearRampToValueAtTime(950, now + 0.015);
    
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(0.025, now + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    
    clickOsc.start(now);
    clickOsc.stop(now + 0.02);
  } catch (e) {
    console.warn('Audio plop played silently:', e);
  }
}

// Crystal Zen Chime Sound on successful AI synthesis
function playChimeSound() {
  initAudioCtx();
  try {
    const now = audioCtx.currentTime;
    // Harmonic Pentatonic A-Major scale arpeggio
    const notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5
    
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09); // Elegant delay
      
      gainNode.gain.setValueAtTime(0, now + idx * 0.09);
      gainNode.gain.linearRampToValueAtTime(0.018, now + idx * 0.09 + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 2.4);
      
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 2.8);
    });
  } catch (e) {
    console.warn('Audio chime played silently:', e);
  }
}

// 3. HTML5 Canvas Metaballs Physics Engine
const canvas = document.getElementById('physics-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const memosOverlay = document.getElementById('memos-overlay');
const undoBtn = document.getElementById('undo-btn');

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initial Memos seeds are removed to allow a perfectly clean, custom blank canvas on startup
const SEED_MEMOS = [];

function initializeSeeds() {
  // Started with a clean slate! No demo seeds spawned.
}

// Dynamic palette evaluator based on text semantic keywords and deterministic hash fallbacks
function getPaletteForContent(text) {
  const clean = (text || '').toLowerCase();
  
  // 1. Semantic keyword matching for high-fidelity thematic coordination
  // Warm Firewood/Fire/Hearth/Sun -> Amber-Orange Sunset Glow
  if (clean.includes('장작') || clean.includes('모닥불') || clean.includes('불꽃') || clean.includes('화로') || clean.includes('fire') || clean.includes('ember') || clean.includes('warm') || clean.includes('따스') || clean.includes('태양') || clean.includes('sun')) {
    return {
      name: 'amber',
      core: 'rgba(245, 158, 11, 1.0)',
      outer: 'rgba(249, 115, 22, 0.85)',
      glow: 'rgba(245, 158, 11, 0.4)'
    };
  }
  
  // Nature/Forest/Wind/Leaf/Calm -> Emerald Green
  if (clean.includes('숲') || clean.includes('나뭇잎') || clean.includes('바람') || clean.includes('자연') || clean.includes('수풀') || clean.includes('forest') || clean.includes('wind') || clean.includes('leaf') || clean.includes('nature') || clean.includes('green') || clean.includes('tree')) {
    return {
      name: 'emerald',
      core: 'rgba(16, 185, 129, 1.0)',
      outer: 'rgba(4, 120, 87, 0.85)',
      glow: 'rgba(16, 185, 129, 0.4)'
    };
  }
  
  // Water/Rain/Storm/Sea/Deep -> Sapphire Royal Blue
  if (clean.includes('비') || clean.includes('빗소리') || clean.includes('물') || clean.includes('바다') || clean.includes('강물') || clean.includes('rain') || clean.includes('water') || clean.includes('sea') || clean.includes('drop') || clean.includes('blue')) {
    return {
      name: 'sapphire',
      core: 'rgba(59, 130, 246, 1.0)',
      outer: 'rgba(30, 58, 138, 0.85)',
      glow: 'rgba(59, 130, 246, 0.4)'
    };
  }
  
  // Tech/Code/Driver/API/IT/Physics -> Cyan (Classic default theme)
  if (clean.includes('코드') || clean.includes('드라이버') || clean.includes('it') || clean.includes('소프트웨어') || clean.includes('개발') || clean.includes('컴퓨터') || clean.includes('code') || clean.includes('driver') || clean.includes('tech') || clean.includes('api') || clean.includes('physics')) {
    return {
      name: 'cyan',
      core: 'rgba(6, 182, 212, 1.0)',
      outer: 'rgba(99, 102, 241, 0.85)',
      glow: 'rgba(6, 182, 212, 0.4)'
    };
  }
  
  // Creativity/Art/Writing/Music/Dream/Synergy -> Violet Cosmic Magenta
  if (clean.includes('예술') || clean.includes('창의') || clean.includes('음악') || clean.includes('꿈') || clean.includes('영감') || clean.includes('시너지') || clean.includes('art') || clean.includes('music') || clean.includes('dream') || clean.includes('inspire') || clean.includes('write') || clean.includes('synergy')) {
    return {
      name: 'violet',
      core: 'rgba(168, 85, 247, 1.0)',
      outer: 'rgba(236, 72, 153, 0.85)',
      glow: 'rgba(168, 85, 247, 0.4)'
    };
  }
  
  // Sunset/Idea/Notepad/Memo/Action -> Orange Energetic Glow
  if (clean.includes('생각') || clean.includes('메모') || clean.includes('아이디어') || clean.includes('일정') || clean.includes('기록') || clean.includes('idea') || clean.includes('notepad') || clean.includes('memo') || clean.includes('action') || clean.includes('orange')) {
    return {
      name: 'orange',
      core: 'rgba(249, 115, 22, 1.0)',
      outer: 'rgba(217, 119, 6, 0.85)',
      glow: 'rgba(249, 115, 22, 0.4)'
    };
  }
  
  // 2. Deterministic string hash fallback to ensure full color diversity across all contents
  const palettes = [
    { name: 'cyan', core: 'rgba(6, 182, 212, 1.0)', outer: 'rgba(99, 102, 241, 0.85)', glow: 'rgba(6, 182, 212, 0.4)' },
    { name: 'emerald', core: 'rgba(16, 185, 129, 1.0)', outer: 'rgba(4, 120, 87, 0.85)', glow: 'rgba(16, 185, 129, 0.4)' },
    { name: 'amber', core: 'rgba(245, 158, 11, 1.0)', outer: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(245, 158, 11, 0.4)' },
    { name: 'violet', core: 'rgba(168, 85, 247, 1.0)', outer: 'rgba(236, 72, 153, 0.85)', glow: 'rgba(168, 85, 247, 0.4)' },
    { name: 'orange', core: 'rgba(249, 115, 22, 1.0)', outer: 'rgba(217, 119, 6, 0.85)', glow: 'rgba(249, 115, 22, 0.4)' },
    { name: 'sapphire', core: 'rgba(59, 130, 246, 1.0)', outer: 'rgba(30, 58, 138, 0.85)', glow: 'rgba(59, 130, 246, 0.4)' }
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

function createDewdrop(text, x, y, customId = null, customDate = null, customRadius = 90, customPalette = null) {
  const id = customId || ('memo-' + Math.random().toString(36).substr(2, 9));
  const now = new Date();
  const dateStr = customDate || `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const palette = customPalette || getPaletteForContent(text);
  
  const memo = {
    id: id,
    text: text,
    date: dateStr,
    x: x !== undefined ? x : canvas.width / 2,
    y: y !== undefined ? y : canvas.height / 2,
    vx: 0,
    vy: 0,
    radius: customRadius,
    isDragging: false,
    colorPalette: palette, // Keep dynamic color palette
    spawnLock: customId ? false : true // Position lock & snap attraction immunity on creation
  };
  
  if (!customId) {
    setTimeout(() => {
      memo.spawnLock = false;
    }, 1500);
  }
  
  memos.push(memo);
  
  // Render glassmorphic card on overlay
  const card = document.createElement('div');
  card.className = 'dewdrop-card';
  card.id = id;
  card.style.left = `${memo.x}px`;
  card.style.top = `${memo.y}px`;
  card.style.width = `${memo.radius * 2}px`;
  card.style.height = `${memo.radius * 2}px`;
  
  // Inject custom CSS custom properties to bind the card highlight glow to the core palette!
  card.style.setProperty('--card-core-color', palette.core);
  card.style.setProperty('--card-glow-color', palette.glow);
  
  card.innerHTML = `
    <div class="dewdrop-text">${text}</div>
    <div class="dewdrop-date">${dateStr}</div>
  `;
  
  // Hook up Drag & Drop bindings
  card.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click drag
      initAudioCtx();
      draggingMemo = memo;
      memo.isDragging = true;
      card.style.cursor = 'grabbing';
      
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
  });
  
  // Right click context menu
  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    activeContextMemo = memo;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
  });
  
  // Double-click to view details and edit memo
  card.addEventListener('dblclick', () => {
    openMemoDetailModal(memo);
  });
  
  memosOverlay.appendChild(card);
  playPlopSound();
}

// Liquid splash particle system variables
let splashParticles = [];

function createPopSplash(x, y, radius, palette = null) {
  // Spawn 18-26 highly dynamic liquid splash particles flying outwards!
  // CRITICAL IMPROVEMENT: Spawn particles along the outer rim of the popped dewdrop to prevent them
  // from overlapping and melting into a single jiggly jelly wobbly ball at the center!
  const count = 18 + Math.floor(Math.random() * 9);
  const spawnRim = radius * 0.45; // spawn spread radius
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const speed = 7 + Math.random() * 12; // super fast snappy initial burst speed!
    
    // Spread starting coordinates outward along their angle
    const startX = x + Math.cos(angle) * spawnRim;
    const startY = y + Math.sin(angle) * spawnRim;
    
    splashParticles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 13 + Math.random() * 19, // varied radius (13px to 32px) for organic splash texture!
      alpha: 1.0,
      decay: 0.045 + Math.random() * 0.035, // snappy shrink rate for a quick pop-and-fade in 0.25 seconds!
      colorPalette: palette
    });
  }
}

// 4. Fluid Physics Frame Loop
function updatePhysics() {
  memos.forEach(m => {
    if (m.isDragging) {
      // Damped spring mass system following pointer
      m.vx += (mouseX - m.x) * PHYSICS_CONFIG.springDamp;
      m.vy += (mouseY - m.y) * PHYSICS_CONFIG.springDamp;
      m.vx *= 0.45; // heavy drag damping
      m.vy *= 0.45;
    } else {
      // Natural inertia & friction
      m.vx *= PHYSICS_CONFIG.friction;
      m.vy *= PHYSICS_CONFIG.friction;
      
      // Screen boundary bounces with damping
      const pad = m.radius;
      if (m.x < pad) { m.x = pad; m.vx *= -0.4; }
      if (m.x > canvas.width - pad) { m.x = canvas.width - pad; m.vx *= -0.4; }
      if (m.y < pad) { m.y = pad; m.vy *= -0.4; }
      if (m.y > canvas.height - pad) { m.y = canvas.height - pad; m.vy *= -0.4; }
    }
    
    if (m.spawnLock) {
      m.vx = 0;
      m.vy = 0;
    }
    
    // Apply dynamic magnetic spring/pull force to auto-merging thoughts!
    if (m.aiAutoMerging) {
      const other = memos.find(x => x.id !== m.id && x.aiAutoMerging);
      if (other) {
        const dx = other.x - m.x;
        const dy = other.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pullStrength = 0.55; 
        m.vx += (dx / dist) * pullStrength;
        m.vy += (dy / dist) * pullStrength;
        
        // Sticky drag damping to prevent overshooting during automated snapping
        m.vx *= 0.88;
        m.vy *= 0.88;
      }
    }
    
    m.x += m.vx;
    m.y += m.vy;
    
    // Reposition Card Overlay perfectly aligned over metaball physics coordinates
    const cardEl = document.getElementById(m.id);
    if (cardEl) {
      cardEl.style.left = `${m.x}px`;
      cardEl.style.top = `${m.y}px`;
    }
  });
  
  // Update liquid splash particles
  for (let i = splashParticles.length - 1; i >= 0; i--) {
    const p = splashParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    
    // High drag/friction (0.86) to quickly slow down the fast initial burst, creating a snappy splash look
    p.vx *= 0.86;
    p.vy *= 0.86;
    
    // Snappy decay speed to evaporate quickly in the viewport
    p.radius -= p.decay * 16;
    
    if (p.radius <= 1.0) {
      splashParticles.splice(i, 1);
    }
  }
  
  // Run surface tension checks
  checkDewdropCollision();
}

function checkDewdropCollision() {
  for (let i = 0; i < memos.length; i++) {
    for (let j = i + 1; j < memos.length; j++) {
      const mA = memos[i];
      const mB = memos[j];
      
      // Safety safeguard: if any of the colliding dewdrops is already undergoing active AI synthesis or has merge immunity, skip checking!
      if (mA.isMerging || mB.isMerging || mA.mergeImmunity || mB.mergeImmunity) continue;
      
      let dx = mB.x - mA.x;
      let dy = mB.y - mA.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      const limit = mA.radius + mB.radius;
      
      if (dist < 1) {
        // Break mathematical symmetry with a tiny random displacement to ensure a non-zero repulsion direction
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle) * 0.5;
        dy = Math.sin(angle) * 0.5;
        dist = 0.5;
      }
      
      // 1. Overlap Collision Repulsion: If they overlap but neither is being dragged, push them apart smoothly!
      if (dist < limit) {
        if (!mA.isDragging && !mB.isDragging && !mA.aiAutoMerging && !mB.aiAutoMerging) {
          const overlap = limit - dist;
          const pushForce = 0.28; // balanced physical bounce
          
          if (mA.spawnLock) {
            mB.vx += (dx / dist) * overlap * pushForce * 1.8;
            mB.vy += (dy / dist) * overlap * pushForce * 1.8;
          } else if (mB.spawnLock) {
            mA.vx -= (dx / dist) * overlap * pushForce * 1.8;
            mA.vy -= (dy / dist) * overlap * pushForce * 1.8;
          } else {
            mA.vx -= (dx / dist) * overlap * pushForce;
            mA.vy -= (dy / dist) * overlap * pushForce;
            mB.vx += (dx / dist) * overlap * pushForce;
            mB.vy += (dy / dist) * overlap * pushForce;
          }
        }
      }
      
      // 2. Snap attraction when dewdrops get within overlap distance + snap buffer (only when not overlapping)
      else if (dist < limit + PHYSICS_CONFIG.snapBuffer) {
        if (!mA.isDragging && !mB.isDragging) {
          if (mA.spawnLock || mB.spawnLock) continue; // Skip snap attraction during active spawn lock!
          
          // Attract force representing surface tension pulling them close
          const force = 0.09;
          mA.vx += (dx / dist) * force;
          mA.vy += (dy / dist) * force;
          mB.vx -= (dx / dist) * force;
          mB.vy -= (dy / dist) * force;
        }
      }
      
      // 3. Trigger full liquid merge: ONLY when the user is actively dragging one of them OR programmatically AI auto-merging!
      // This is the fundamental safeguard to prevent any accidental auto-merges during load, refresh, or rollback.
      if (dist < limit * PHYSICS_CONFIG.minMergeRatio) {
        if (mA.isDragging || mB.isDragging || mA.aiAutoMerging || mB.aiAutoMerging) {
          triggerSynthesisMerge(mA, mB);
          return; // Break loop immediately as index structures have changed
        }
      }
    }
  }
}

// 5. Drawing liquid circles on canvas inside the blur/contrast compositor
function renderLiquidBlobs() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  memos.forEach(m => {
    // Ensuring colorPalette is set for dynamic backwards compatibility
    if (!m.colorPalette) {
      m.colorPalette = getPaletteForContent(m.text);
    }
    
    // Glowing liquid blob
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
    grad.addColorStop(0, m.colorPalette.core);     // vibrant custom core color
    grad.addColorStop(0.45, m.colorPalette.outer); // rich custom outer color
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');          // transparent boundary
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight glint (creates a realistic 3D glassy water droplet reflections)
    const highlight = ctx.createRadialGradient(
      m.x - m.radius * 0.22, m.y - m.radius * 0.22, 0,
      m.x - m.radius * 0.22, m.y - m.radius * 0.22, m.radius * 0.2
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(m.x - m.radius * 0.22, m.y - m.radius * 0.22, m.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Render pop splash particles inside the metaball compositor!
  splashParticles.forEach(p => {
    const activePalette = p.colorPalette || { core: 'rgba(6, 182, 212, 1.0)', outer: 'rgba(99, 102, 241, 0.85)' };
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    grad.addColorStop(0, activePalette.core);     // glowing custom core
    grad.addColorStop(0.5, activePalette.outer); // custom outer transition
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Main Frame Engine
function physicsLoop() {
  updatePhysics();
  renderLiquidBlobs();
  requestAnimationFrame(physicsLoop);
}

// Track mouse/drag movements globally to bypass pointer-events containers
document.addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

window.addEventListener('mouseup', () => {
  if (draggingMemo) {
    const cardEl = document.getElementById(draggingMemo.id);
    if (cardEl) cardEl.style.cursor = 'grab';
    draggingMemo.isDragging = false;
    draggingMemo = null;
    
    // Auto-save debounced because position coordinate changed
    scheduleAutoSave();
  }
});

// Hide context menu on click
window.addEventListener('click', () => {
  document.getElementById('context-menu').style.display = 'none';
});

// Handle single thought AI enhancement
document.getElementById('ctx-enhance-btn').addEventListener('click', () => {
  if (activeContextMemo) {
    enhanceSingleThought(activeContextMemo);
    activeContextMemo = null;
  }
});

// Memo Detail & Editing Modal Controllers
const memoDetailOverlay = document.getElementById('memo-detail-overlay');
const memoDetailText = document.getElementById('memo-detail-text');
const memoDetailDate = document.getElementById('memo-detail-date');
let activeDetailMemo = null;

function openMemoDetailModal(memo) {
  activeDetailMemo = memo;
  memoDetailDate.textContent = memo.date;
  memoDetailText.value = memo.text;
  memoDetailOverlay.classList.add('active');
  memoDetailText.focus();
  memoDetailText.setSelectionRange(0, 0); // Position cursor at the beginning
  memoDetailText.scrollTop = 0; // Scroll back to the top
}

document.getElementById('memo-detail-cancel').addEventListener('click', () => {
  memoDetailOverlay.classList.remove('active');
  activeDetailMemo = null;
});

// Handle thought droplet explosion/deletion inside detail modal
document.getElementById('memo-detail-delete').addEventListener('click', () => {
  if (activeDetailMemo) {
    if (confirm(I18N_DICTIONARY[currentLanguage].toastPopConfirm)) {
      pushUndoState(); // Store rollback point
      
      // Trigger pop splash particles on canvas!
      createPopSplash(activeDetailMemo.x, activeDetailMemo.y, activeDetailMemo.radius, activeDetailMemo.colorPalette);
      
      const cardEl = document.getElementById(activeDetailMemo.id);
      if (cardEl) {
        cardEl.classList.add('exploding');
        setTimeout(() => cardEl.remove(), 400);
      }
      memos = memos.filter(m => m.id !== activeDetailMemo.id);
      playPlopSound();
      showToast(I18N_DICTIONARY[currentLanguage].toastPopped, 'info');
      
      memoDetailOverlay.classList.remove('active');
      activeDetailMemo = null;
      saveProjectState(); // Auto-save project state
    }
  }
});

// Close memo detail modal if backdrop clicked
memoDetailOverlay.addEventListener('click', (e) => {
  if (e.target === memoDetailOverlay) {
    memoDetailOverlay.classList.remove('active');
    activeDetailMemo = null;
  }
});

document.getElementById('memo-detail-save').addEventListener('click', () => {
  const updatedText = memoDetailText.value.trim();
  if (!updatedText) {
    showToast(I18N_DICTIONARY[currentLanguage].toastInputNeeded, 'warning');
    return;
  }
  
  if (activeDetailMemo) {
    pushUndoState(); // Store rollback point before modifying!
    
    // 1. Update text and calculate dynamic new radius based on content length
    activeDetailMemo.text = updatedText;
    
    // Dynamic radius formula: base 90px + scaling offset (sqrt to scale nicely)
    const baseLength = updatedText.length;
    const computedRadius = Math.min(135, Math.max(90, 80 + Math.sqrt(baseLength) * 5));
    activeDetailMemo.radius = computedRadius;
    
    // 2. Update Card DOM text and radius styling
    const cardEl = document.getElementById(activeDetailMemo.id);
    if (cardEl) {
      cardEl.querySelector('.dewdrop-text').textContent = updatedText;
      cardEl.style.width = `${computedRadius * 2}px`;
      cardEl.style.height = `${computedRadius * 2}px`;
      
      // Update custom color variables dynamically based on edited content!
      const palette = getPaletteForContent(updatedText);
      activeDetailMemo.colorPalette = palette;
      cardEl.style.setProperty('--card-core-color', palette.core);
      cardEl.style.setProperty('--card-glow-color', palette.glow);
      
      // Pulse animation to notify change
      cardEl.classList.add('merging');
      setTimeout(() => cardEl.classList.remove('merging'), 1200);
    }
    
    // 3. Save state & notify
    saveProjectState();
    showToast(I18N_DICTIONARY[currentLanguage].toastUpdated, 'success');
    
    memoDetailOverlay.classList.remove('active');
    activeDetailMemo = null;
  }
});

// Handle thought droplet explosion/deletion
document.getElementById('ctx-delete-btn').addEventListener('click', () => {
  if (activeContextMemo) {
    pushUndoState(); // Store rollback point
    
    // Trigger pop splash particles on canvas!
    createPopSplash(activeContextMemo.x, activeContextMemo.y, activeContextMemo.radius, activeContextMemo.colorPalette);
    
    const cardEl = document.getElementById(activeContextMemo.id);
    if (cardEl) {
      cardEl.classList.add('exploding');
      setTimeout(() => cardEl.remove(), 400);
    }
    memos = memos.filter(m => m.id !== activeContextMemo.id);
    playPlopSound();
    showToast(I18N_DICTIONARY[currentLanguage].toastPopped, 'info');
    
    activeContextMemo = null;
    saveProjectState(); // Auto-save project state
  }
});

// AI Single Thought Enhancer Function
async function enhanceSingleThought(memo) {
  pushUndoState(); // Store current state for ROLLBACK capabilities!

  // Play droplet snap sound
  playPlopSound();
  
  // Flag card as active AI thinking (No full-screen popups!)
  const cardEl = document.getElementById(memo.id);
  if (cardEl) {
    cardEl.classList.add('ai-thinking');
  }
  
  const apiKey = apiKeyInput.value.trim();
  const provider = aiProviderSelect.value;
  const text = memo.text;
  
  try {
    const res = await fetch('/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        customApiKey: apiKey,
        provider,
        language: currentLanguage
      })
    });
    
    if (!res.ok) throw new Error();
    const responseData = await res.json();
    const resultText = responseData.text;
    
    // Update the memo object in the array
    memo.text = resultText;
    // Dynamically increase its radius slightly since the text is enriched
    memo.radius = Math.min(135, memo.radius + 15);
    
    // Update the color palette dynamically matching the refined AI thought!
    const palette = getPaletteForContent(resultText);
    memo.colorPalette = palette;
    
    // Update the DOM card text directly
    if (cardEl) {
      cardEl.classList.remove('ai-thinking');
      cardEl.querySelector('.dewdrop-text').textContent = resultText;
      // Apply a minor scale animation and size change
      cardEl.style.width = `${memo.radius * 2}px`;
      cardEl.style.height = `${memo.radius * 2}px`;
      
      // Sync dynamic color custom properties!
      cardEl.style.setProperty('--card-core-color', palette.core);
      cardEl.style.setProperty('--card-glow-color', palette.glow);
      
      cardEl.classList.add('merging'); // trigger a quick pulse ring
      setTimeout(() => cardEl.classList.remove('merging'), 1200);
    }
    
    // Append record to history sidebar
    appendHistoryItem(text, currentLanguage === 'ko' ? 'AI 생각 보강' : 'AI Thought Enhance', resultText);
    
    // Play crystal arpeggio chime
    playChimeSound();
    
    // Toast status
    const providerName = aiProviderSelect.options[aiProviderSelect.selectedIndex].text.split(' (')[0];
    showToast(I18N_DICTIONARY[currentLanguage].toastEnhancedSuccess.replace('{providerName}', providerName), 'success', {
      text: I18N_DICTIONARY[currentLanguage].toastUndo,
      callback: rollback
    });
    
    // Auto-save active state
    saveProjectState();
    
  } catch (err) {
    console.error('Single Enhance Failed:', err);
    if (cardEl) {
      cardEl.classList.remove('ai-thinking');
    }
    showToast(I18N_DICTIONARY[currentLanguage].toastEnhancedFail, 'warning');
  }
}

// Clear entire workspace
document.getElementById('clear-canvas-btn').addEventListener('click', () => {
  if (confirm(I18N_DICTIONARY[currentLanguage].toastClearConfirm)) {
    pushUndoState(); // Store rollback point
    
    memosOverlay.innerHTML = '';
    memos = [];
    playPlopSound();
    showToast(I18N_DICTIONARY[currentLanguage].toastCleared, 'warning');
    saveProjectState(); // Auto-save project state
  }
});

// Add custom new thoughts exactly at the center of the visible viewport, searching for a non-overlapping spot
document.getElementById('add-memo-btn').addEventListener('click', () => {
  const inputEl = document.getElementById('memo-input');
  const text = inputEl.value.trim();
  if (text) {
    // Calculate maximum safe dewdrop limit dynamically based on canvas dimensions and standard dewdrop size
    // A standard dewdrop has diameter 180px, plus a safety gap of 120px to prevent snap attraction (total 300px bounding square)
    const standardDiameterWithGap = 90 * 2 + 120; // 300px
    const maxDewdropLimit = Math.floor((canvas.width * canvas.height) / Math.pow(standardDiameterWithGap, 2)); // 4,320,000 / 90,000 = 48

    if (memos.length >= maxDewdropLimit) {
      showToast(I18N_DICTIONARY[currentLanguage].toastLimitReached.replace('{max}', maxDewdropLimit), 'warning');
      return;
    }

    const scrollWrapper = document.getElementById('board-scroll-wrapper');
    
    // Default fallback to center of the virtual board if scrollWrapper isn't found
    let rx = canvas.width / 2;
    let ry = canvas.height / 2;
    
    if (scrollWrapper) {
      const viewW = scrollWrapper.clientWidth;
      const viewH = scrollWrapper.clientHeight;
      const scrollX = scrollWrapper.scrollLeft;
      const scrollY = scrollWrapper.scrollTop;
      
      rx = scrollX + viewW / 2;
      ry = scrollY + viewH / 2;
    }

    // Dynamic radius calculation based on text length to perfectly align with physics metrics
    const baseLength = text.length;
    const newRadius = Math.min(135, Math.max(90, 80 + Math.sqrt(baseLength) * 5));

    // Spiral search to find a completely non-overlapping position near the center of the viewport
    let foundSafeSpot = false;
    let angle = 0;
    let distance = 0;
    const maxRadius = 1200; // search limit in pixels
    
    while (distance < maxRadius && !foundSafeSpot) {
      let candidateX = rx + Math.cos(angle) * distance;
      let candidateY = ry + Math.sin(angle) * distance;
      
      // Clamping safeguards to stay inside the virtual board boundaries with pad
      candidateX = Math.max(newRadius + 50, Math.min(canvas.width - (newRadius + 50), candidateX));
      candidateY = Math.max(newRadius + 50, Math.min(canvas.height - (newRadius + 50), candidateY));
      
      // Check if this candidate overlaps or is within snap attraction range of any existing dewdrop
      let hasOverlap = false;
      for (let i = 0; i < memos.length; i++) {
        const m = memos[i];
        const dx = candidateX - m.x;
        const dy = candidateY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Ensure no snap attraction on spawn: distance must be >= sum of radii + snapBuffer + 90px safety gap
        if (dist < m.radius + newRadius + PHYSICS_CONFIG.snapBuffer + 90) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        rx = candidateX;
        ry = candidateY;
        foundSafeSpot = true;
      } else {
        // Spiral path: increase angle and step outward
        angle += 0.25;      // rotation angle step
        distance += 5.0;    // distance step outward
      }
    }
    
    // Create dewdrop at the non-overlapping center/near-center!
    createDewdrop(text, rx, ry, null, null, newRadius);
    
    inputEl.value = '';
    saveProjectState(); // Auto-save active state
  }
});

// API status & provider tracker
const apiKeyInput = document.getElementById('api-key-input');
const apiStatus = document.getElementById('api-status');
const aiProviderSelect = document.getElementById('ai-provider-select');

let cachedProviderKeys = {
  gemini: '',
  deepseek: '',
  openrouter: ''
};

try {
  const savedKeys = localStorage.getItem('dewdrop_cached_keys');
  if (savedKeys) {
    cachedProviderKeys = JSON.parse(savedKeys);
  }
} catch (e) {
  console.warn('Failed to load cached API keys from localStorage:', e);
}

let currentProvider = localStorage.getItem('dewdrop_ai_provider') || 'gemini';

// Immediately sync dropdown and input states
aiProviderSelect.value = currentProvider;
if (currentProvider === 'simulator') {
  apiKeyInput.value = '';
  apiKeyInput.disabled = true;
  apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderSimulator;
} else {
  apiKeyInput.disabled = false;
  apiKeyInput.value = cachedProviderKeys[currentProvider] || '';
  if (currentProvider === 'gemini') {
    apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderGemini;
  } else if (currentProvider === 'deepseek') {
    apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderDeepseek;
  } else if (currentProvider === 'openrouter') {
    apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderOpenrouter;
  }
}

// Handle provider dropdown changes
aiProviderSelect.addEventListener('change', () => {
  const provider = aiProviderSelect.value;
  
  // Save current key to cache before switching
  if (currentProvider !== 'simulator') {
    cachedProviderKeys[currentProvider] = apiKeyInput.value.trim();
    localStorage.setItem('dewdrop_cached_keys', JSON.stringify(cachedProviderKeys));
  }
  
  currentProvider = provider;
  localStorage.setItem('dewdrop_ai_provider', provider);
  
  if (provider === 'simulator') {
    apiKeyInput.value = '';
    apiKeyInput.disabled = true;
    apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderSimulator;
    apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusSimulation;
    apiStatus.className = "api-status";
  } else {
    apiKeyInput.disabled = false;
    apiKeyInput.value = cachedProviderKeys[provider] || '';
    
    // Update placeholders dynamically
    if (provider === 'gemini') {
      apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderGemini;
    } else if (provider === 'deepseek') {
      apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderDeepseek;
    } else if (provider === 'openrouter') {
      apiKeyInput.placeholder = I18N_DICTIONARY[currentLanguage].placeholderOpenrouter;
    }
    
    updateApiStatusText();
  }
});

apiKeyInput.addEventListener('input', () => {
  updateApiStatusText();
  if (currentProvider !== 'simulator') {
    cachedProviderKeys[currentProvider] = apiKeyInput.value.trim();
    localStorage.setItem('dewdrop_cached_keys', JSON.stringify(cachedProviderKeys));
  }
});

// Update API connection badge status text dynamically
function updateApiStatusText() {
  const key = apiKeyInput.value.trim();
  
  let cleanProviderName = "AI";
  const selectedOptionText = aiProviderSelect.options[aiProviderSelect.selectedIndex]?.text || "";
  if (selectedOptionText.includes("Gemini")) cleanProviderName = "Gemini";
  else if (selectedOptionText.includes("DeepSeek")) cleanProviderName = "DeepSeek";
  else if (selectedOptionText.includes("OpenRouter")) cleanProviderName = "OpenRouter";
  
  if (key) {
    apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusConnectedCustom.replace('{providerName}', cleanProviderName);
    apiStatus.className = "api-status connected";
  } else {
    detectServerApiKey();
  }
}

// Helper: Query server connection status & API configuration
async function detectServerApiKey() {
  const provider = aiProviderSelect.value;
  
  let cleanProviderName = "AI";
  const selectedOptionText = aiProviderSelect.options[aiProviderSelect.selectedIndex]?.text || "";
  if (selectedOptionText.includes("Gemini")) cleanProviderName = "Gemini";
  else if (selectedOptionText.includes("DeepSeek")) cleanProviderName = "DeepSeek";
  else if (selectedOptionText.includes("OpenRouter")) cleanProviderName = "OpenRouter";
  
  if (provider === 'simulator') {
    apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusSimulation;
    apiStatus.className = "api-status";
    return;
  }
  
  try {
    apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusChecking;
    apiStatus.className = "api-status";
    
    const res = await fetch('/api/keys/status');
    if (!res.ok) throw new Error();
    
    const status = await res.json();
    const hasServerKey = status[provider];
    
    if (hasServerKey) {
      apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusConnectedServer.replace('{providerName}', cleanProviderName);
      apiStatus.className = "api-status connected";
    } else {
      apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusNoServerKey.replace('{providerName}', cleanProviderName);
      apiStatus.className = "api-status warning-status";
    }
  } catch (e) {
    apiStatus.textContent = I18N_DICTIONARY[currentLanguage].statusServerDelay;
    apiStatus.className = "api-status";
  }
}

// --------------------------------------------------------------------------
// 🧠 Rollback (Undo) History Engine
// --------------------------------------------------------------------------

function pushUndoState() {
  // Capture current deep copies of memos and history lists
  const historyList = document.getElementById('history-list');
  const historyData = [];
  
  historyList.querySelectorAll('.history-item').forEach(item => {
    // Extract metadata
    const header = item.querySelector('.history-item-header');
    const body = item.querySelector('.history-item-body');
    historyData.push({
      title: header.children[0].textContent,
      time: header.children[1].textContent,
      text: body.textContent.trim(),
      fullResult: item.getAttribute('data-full') || body.title
    });
  });

  const state = {
    memos: JSON.parse(JSON.stringify(memos)),
    history: historyData
  };

  undoStack.push(state);
  if (undoStack.length > 10) {
    undoStack.shift(); // Cap capacity at 10 items
  }

  undoBtn.disabled = false;
}

function rollback() {
  if (undoStack.length === 0) return;

  playPlopSound();
  const previousState = undoStack.pop();

  // Set local storage flag for page-refresh safety!
  localStorage.setItem('dewdrop_just_restored', 'true');

  // 1. Clear current DOM card overlays
  memosOverlay.innerHTML = '';
  memos = [];

  // 2. Restore memos from captured state
  // If the rollback was for a synthesis merge, pre-adjust coordinates inside previousState to be safely separated before creation
  if (lastMergedIds && lastMergedIds.length === 2) {
    console.log('Rollback: synthesis merge detected for IDs:', lastMergedIds);
    const mergeMemos = previousState.memos.filter(m => lastMergedIds.includes(m.id));
    console.log('Rollback: matching restored memos count:', mergeMemos.length);
    if (mergeMemos.length === 2) {
      const mA = mergeMemos[0];
      const mB = mergeMemos[1];
      const midX = (mA.x + mB.x) / 2;
      const midY = (mA.y + mB.y) / 2;
      
      const dx = mA.x - midX;
      const dy = mA.y - midY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Separate completely beyond snap attraction pull range (limit + snapBuffer + 60px safety zone)
      const safeDist = mA.radius + mB.radius + PHYSICS_CONFIG.snapBuffer + 60;
      const halfSafeDist = safeDist / 2;
      
      // Update coordinates in the state structure that will be written to both DOM and backend project file
      mA.x = midX + (dx / dist) * halfSafeDist;
      mA.y = midY + (dy / dist) * halfSafeDist;
      mB.x = midX - (dx / dist) * halfSafeDist;
      mB.y = midY - (dy / dist) * halfSafeDist;
      console.log(`Rollback: safely separated to distance ${safeDist}px. Coordinates updated.`, mA.x, mA.y, mB.x, mB.y);
    }
  }

  previousState.memos.forEach(m => {
    createDewdrop(m.text, m.x, m.y, m.id, m.date, m.radius, m.colorPalette);
  });

  // Apply visual outward physics blast and temporary merge immunity
  if (lastMergedIds && lastMergedIds.length === 2) {
    const restoredMemos = memos.filter(m => lastMergedIds.includes(m.id));
    if (restoredMemos.length === 2) {
      const mA = restoredMemos[0];
      const mB = restoredMemos[1];
      const midX = (mA.x + mB.x) / 2;
      const midY = (mA.y + mB.y) / 2;
      
      restoredMemos.forEach(m => {
        const dx = m.x - midX;
        const dy = m.y - midY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        m.vx = (dx / dist) * 12; // spring outward
        m.vy = (dy / dist) * 12;
        
        m.mergeImmunity = true;
        setTimeout(() => {
          m.mergeImmunity = false;
        }, 2200); // 2.2 seconds immunity
      });
    }
    lastMergedIds = []; // clear
  }

  // 3. Restore History UI list
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  if (previousState.history.length === 0) {
    historyList.innerHTML = `<div class="empty-history">${I18N_DICTIONARY[currentLanguage].emptyHistory}</div>`;
  } else {
    previousState.history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.setAttribute('data-full', item.fullResult);
      el.innerHTML = `
        <div class="history-item-header">
          <span>${item.title}</span>
          <span>${item.time}</span>
        </div>
        <div class="history-item-body" title="${item.fullResult}">
          ${item.text}
        </div>
      `;
      
      el.addEventListener('click', () => {
        alert(`[Thought Fusion History]\n\n${item.fullResult}`);
      });
      
      historyList.appendChild(el);
    });
  }

  // 4. Manage undo button accessibility
  if (undoStack.length === 0) {
    undoBtn.disabled = true;
  }

  // 5. Update backend persistence project file
  saveProjectState();

  showToast(I18N_DICTIONARY[currentLanguage].toastRolledBack, 'info');
}

// Hook up header button
undoBtn.addEventListener('click', rollback);

// Global keyboard shortcut listener (Ctrl+Z)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    // Prevent undo actions inside inputs/textareas to allow native text editing
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }
    e.preventDefault();
    rollback();
  }
});

// --------------------------------------------------------------------------
// 📨 Toast Notifications Manager
// --------------------------------------------------------------------------

function showToast(message, type = 'info', action = null) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSVG = '';
  if (type === 'success') {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'warning') {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>`;
  } else {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>`;
  }

  let actionHTML = '';
  if (action) {
    actionHTML = `<button class="toast-action-btn">${action.text}</button>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSVG}</div>
    <div class="toast-message" style="flex: 1;">${message}</div>
    ${actionHTML}
  `;

  if (action) {
    const btn = toast.querySelector('.toast-action-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      action.callback();
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    });
  }

  container.appendChild(toast);
  
  // Trigger transition slide-in
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto dismiss card
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    }
  }, action ? 5000 : 3500);
}

// --------------------------------------------------------------------------
// 💾 REST API Backed Project Workspace Persistence & Autosaving
// --------------------------------------------------------------------------

// 1. Debounced Autosave Trigger
function scheduleAutoSave() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    saveProjectState();
  }, 800); // 800ms debounce
}

// 2. POST /api/projects - Saves active project state
async function saveProjectState() {
  if (!currentProjectId) return;
  
  try {
    const historyList = document.getElementById('history-list');
    const historyData = [];
    
    historyList.querySelectorAll('.history-item').forEach(item => {
      const header = item.querySelector('.history-item-header');
      const body = item.querySelector('.history-item-body');
      historyData.push({
        title: header.children[0].textContent,
        time: header.children[1].textContent,
        text: body.textContent.trim(),
        fullResult: item.getAttribute('data-full') || body.title
      });
    });

    // Use robust global title variable instead of DOM queries to prevent race conditions
    const title = currentProjectTitle || (currentLanguage === 'ko' ? '기본 생각 지도' : 'Default Mind Map');

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentProjectId,
        title: title,
        memos: memos,
        history: historyData
      })
    });
    
    if (res.ok) {
      // Dynamic in-place droplet count update to prevent full list re-render flickering
      const activeMetaCount = document.querySelector('.active-canvas .canvas-item-meta span:last-child');
      if (activeMetaCount) {
        activeMetaCount.textContent = currentLanguage === 'ko' ? `생각 ${memos.length}개` : `${memos.length} Thoughts`;
      }
    }
  } catch (e) {
    console.error('Failed to autosave project state to server:', e);
  }
}

// 3. GET /api/projects/active - Loads latest active workspace on start
async function loadActiveProjectOnStart() {
  try {
    const res = await fetch(`/api/projects/active?_t=${Date.now()}&lang=${currentLanguage}`);
    if (!res.ok) throw new Error('API offline');
    
    const data = await res.json();
    
    memosOverlay.innerHTML = '';
    memos = [];
    currentProjectId = data.id || 'proj-default';
    currentProjectTitle = data.title || (currentLanguage === 'ko' ? '기본 생각 지도' : 'Default Mind Map');
    
    // Clear initial seeds if we loaded actual content
    if (data.memos && data.memos.length > 0) {
      data.memos.forEach(m => {
        createDewdrop(m.text, m.x, m.y, m.id, m.date, m.radius, m.colorPalette);
      });
      
      // Load History UI list
      const historyList = document.getElementById('history-list');
      historyList.innerHTML = '';
      
      if (data.history && data.history.length > 0) {
        const empty = historyList.querySelector('.empty-history');
        if (empty) empty.remove();
        
        data.history.forEach(item => {
          const el = document.createElement('div');
          el.className = 'history-item';
          el.setAttribute('data-full', item.fullResult);
          el.innerHTML = `
            <div class="history-item-header">
              <span>${item.title}</span>
              <span>${item.time}</span>
            </div>
            <div class="history-item-body" title="${item.fullResult}">
              ${item.text}
            </div>
          `;
          
          el.addEventListener('click', () => {
            alert(`[Thought Fusion History]\n\n${item.fullResult}`);
          });
          historyList.appendChild(el);
        });
      }
      showToast(I18N_DICTIONARY[currentLanguage].toastProjectLoaded.replace('{title}', data.title), 'success');
    } else {
      // First startup: Seed default beautiful elements ( approved in #1 )
      initializeSeeds();
      saveProjectState(); // Sync initial seed positions to database file
    }
  } catch (e) {
    console.warn('Backend API connection failed, starting client offline fallback:', e);
    currentProjectId = 'proj-default';
    currentProjectTitle = currentLanguage === 'ko' ? '기본 생각 지도' : 'Default Mind Map';
    initializeSeeds();
  }
}

// 4. GET /api/projects - Fetch list of all registered projects
async function fetchProjects() {
  const listEl = document.getElementById('project-list');
  try {
    const res = await fetch('/api/projects?_t=' + Date.now());
    if (!res.ok) throw new Error();
    const data = await res.json();

    listEl.innerHTML = '';
    if (data.length === 0) {
      listEl.innerHTML = `<div class="empty-canvases">${I18N_DICTIONARY[currentLanguage].emptyCanvases}</div>`;
      return;
    }

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = `canvas-item ${currentProjectId === item.id ? 'active-canvas' : ''}`;
      
      const infoBlock = document.createElement('div');
      infoBlock.className = 'canvas-item-info';
      infoBlock.innerHTML = `
        <div class="canvas-item-title">${item.title}</div>
        <div class="canvas-item-meta">
          <span>${item.date.split(' ')[0]}</span>
          <div class="canvas-item-dot"></div>
          <span>${currentLanguage === 'ko' ? '생각 ' + item.memoCount + '개' : item.memoCount + ' Thoughts'}</span>
        </div>
      `;

      // Premium Rename Icon ( Pencil )
      const renameBtn = document.createElement('button');
      renameBtn.className = 'canvas-item-edit';
      renameBtn.title = currentLanguage === 'ko' ? '이름 변경' : 'Rename';
      renameBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
        </svg>
      `;

      // Premium Delete Trash Icon
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'canvas-item-delete';
      deleteBtn.title = currentLanguage === 'ko' ? '삭제' : 'Delete';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;

      card.appendChild(infoBlock);
      card.appendChild(renameBtn);
      card.appendChild(deleteBtn);

      // Load action on click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.canvas-item-delete') || e.target.closest('.canvas-item-edit')) return;
        loadProject(item.id);
      });

      // Bind Rename Modal Launcher
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRenameModal(item.id, item.title);
      });

      // Bind Delete Confirm Trigger
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(item.id);
      });

      listEl.appendChild(card);
    });
  } catch (e) {
    listEl.innerHTML = `<div class="empty-canvases" style="color: var(--text-dark);">${currentLanguage === 'ko' ? '프로젝트 서버 통신 지연' : 'Server Connection Delay'}</div>`;
  }
}

// 5. GET /api/projects/:id - Load specific project workspace
async function loadProject(id) {
  if (currentProjectId === id) return;
  
  try {
    pushUndoState(); // Store rollback snapshot before leaving current workspace!
    undoStack = []; // Reset undo stack specifically for the new workspace!
    undoBtn.disabled = true;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }

    const res = await fetch(`/api/projects/${id}?_t=` + Date.now());
    if (!res.ok) throw new Error();
    const data = await res.json();

    // Reset workspace DOM and local memos state
    memosOverlay.innerHTML = '';
    memos = [];

    // Spawn project dewdrops (approved seed logic fallback if empty)
    if (data.memos && data.memos.length > 0) {
      data.memos.forEach(m => {
        createDewdrop(m.text, m.x, m.y, m.id, m.date, m.radius, m.colorPalette);
      });
    } else {
      initializeSeeds();
    }

    // Populate fusion history logs
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (data.history && data.history.length > 0) {
      data.history.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.setAttribute('data-full', item.fullResult);
        el.innerHTML = `
          <div class="history-item-header">
            <span>${item.title}</span>
            <span>${item.time}</span>
          </div>
          <div class="history-item-body" title="${item.fullResult}">
            ${item.text}
          </div>
        `;
        
        el.addEventListener('click', () => {
          alert(`[Thought Fusion History]\n\n${item.fullResult}`);
        });
        historyList.appendChild(el);
      });
    } else {
      historyList.innerHTML = `<div class="empty-history">${I18N_DICTIONARY[currentLanguage].emptyHistory}</div>`;
    }

    currentProjectId = id;
    currentProjectTitle = data.title || (currentLanguage === 'ko' ? '기본 생각 지도' : 'Default Mind Map');
    fetchProjects(); // Refresh sidebar to apply active highlights
    saveProjectState(); // Keep autosave synchronized on load

    showToast(I18N_DICTIONARY[currentLanguage].toastProjectSwitched.replace('{title}', data.title), 'success');
  } catch (e) {
    showToast(currentLanguage === 'ko' ? '프로젝트 작업 공간을 전환하는 데 실패했습니다.' : 'Failed to switch project workspace.', 'warning');
  }
}

// 6. POST /api/projects - Register a new Mind Map project
async function createProject(name) {
  if (!name.trim()) return;
  
  const id = 'proj-' + Math.random().toString(36).substr(2, 9);
  
  try {
    // 1. Switch local context
    currentProjectId = id;
    currentProjectTitle = name;
    memosOverlay.innerHTML = '';
    memos = [];
    
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = `<div class="empty-history">${I18N_DICTIONARY[currentLanguage].emptyHistory}</div>`;
    
    // 2. Spawn default seeds beautifully (approved #1)
    initializeSeeds();
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    // 3. Register to database
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        title: name,
        memos: memos,
        history: []
      })
    });

    if (!res.ok) throw new Error();
    
    undoStack = []; // Reset undo stack for the new project workspace
    undoBtn.disabled = true;
    
    await fetchProjects();
    await saveProjectState(); // Autosave immediately to keep positions synced

    showToast(I18N_DICTIONARY[currentLanguage].toastProjectCreated.replace('{title}', name), 'success');
  } catch (e) {
    showToast(currentLanguage === 'ko' ? '프로젝트 등록에 실패했습니다.' : 'Failed to register project.', 'warning');
  }
}

// 7. DELETE /api/projects/:id - Safely delete a Project
async function deleteProject(id) {
  if (!confirm(I18N_DICTIONARY[currentLanguage].toastProjectDeleteConfirm)) return;

  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }

  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error();

    showToast(I18N_DICTIONARY[currentLanguage].toastProjectDeleted, 'info');

    if (currentProjectId === id) {
      currentProjectId = null;
      // Active project was deleted, load active fallback dynamically
      await loadActiveProjectOnStart();
    }
    
    fetchProjects();
  } catch (e) {
    showToast(I18N_DICTIONARY[currentLanguage].toastProjectDeleteFail, 'warning');
  }
}

// 8. POST /api/projects/:id/rename - Renames project
async function renameProject(id, newName) {
  if (!newName.trim()) return;

  try {
    const res = await fetch(`/api/projects/${id}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newName })
    });
    
    if (!res.ok) throw new Error();

    showToast(I18N_DICTIONARY[currentLanguage].toastProjectRenamed.replace('{title}', newName), 'success');
    if (id === currentProjectId) {
      currentProjectTitle = newName;
    }
    fetchProjects();
  } catch (e) {
    showToast(I18N_DICTIONARY[currentLanguage].toastProjectRenameFail, 'warning');
  }
}

// --------------------------------------------------------------------------
// 📨 Dynamic Save & Rename Dialog Modals handlers
// --------------------------------------------------------------------------
const saveModal = document.getElementById('save-modal-overlay');
const saveTitleInput = document.getElementById('canvas-title-input');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalConfirmBtn = document.getElementById('save-modal-confirm');

// Open modal in creation mode
document.getElementById('save-canvas-btn').addEventListener('click', () => {
  modalMode = 'create';
  renameTargetProjectId = null;
  
  modalTitle.textContent = I18N_DICTIONARY[currentLanguage].modalCreateTitle;
  modalDesc.textContent = I18N_DICTIONARY[currentLanguage].modalCreateDesc;
  saveTitleInput.placeholder = I18N_DICTIONARY[currentLanguage].modalCreatePlaceholder;
  saveTitleInput.value = '';
  modalConfirmBtn.textContent = I18N_DICTIONARY[currentLanguage].modalCreateConfirm;
  document.getElementById('save-modal-cancel').textContent = I18N_DICTIONARY[currentLanguage].modalCancel;
  
  saveModal.classList.add('active');
  saveTitleInput.focus();
});

// Open modal in rename mode
function openRenameModal(id, currentTitle) {
  modalMode = 'rename';
  renameTargetProjectId = id;
  
  modalTitle.textContent = I18N_DICTIONARY[currentLanguage].modalRenameTitle;
  modalDesc.textContent = I18N_DICTIONARY[currentLanguage].modalRenameDesc;
  saveTitleInput.placeholder = I18N_DICTIONARY[currentLanguage].modalRenamePlaceholder;
  saveTitleInput.value = currentTitle;
  modalConfirmBtn.textContent = I18N_DICTIONARY[currentLanguage].modalRenameConfirm;
  document.getElementById('save-modal-cancel').textContent = I18N_DICTIONARY[currentLanguage].modalCancel;
  
  saveModal.classList.add('active');
  saveTitleInput.focus();
}

document.getElementById('save-modal-cancel').addEventListener('click', () => {
  saveModal.classList.remove('active');
});

document.getElementById('save-modal-confirm').addEventListener('click', () => {
  const title = saveTitleInput.value.trim();
  if (!title) {
    showToast(I18N_DICTIONARY[currentLanguage].toastProjectInputNeeded, 'warning');
    return;
  }

  if (modalMode === 'create') {
    createProject(title);
  } else if (modalMode === 'rename') {
    renameProject(renameTargetProjectId, title);
  }
  
  saveModal.classList.remove('active');
});

// Close modal if backdrop clicked
saveModal.addEventListener('click', (e) => {
  if (e.target === saveModal) {
    saveModal.classList.remove('active');
  }
});

// --------------------------------------------------------------------------
// ⚙️ Global Settings Modal Controllers & Listeners
// --------------------------------------------------------------------------
const settingsModal = document.getElementById('settings-modal-overlay');
const settingsLanguageSelect = document.getElementById('settings-language-select');

document.getElementById('global-settings-btn').addEventListener('click', () => {
  // Sync select input to active currentLanguage before displaying
  settingsLanguageSelect.value = currentLanguage;
  settingsModal.classList.add('active');
});

document.getElementById('settings-modal-close').addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

settingsLanguageSelect.addEventListener('change', () => {
  const selectedLang = settingsLanguageSelect.value;
  applyLanguage(selectedLang);
});

// Close settings modal if backdrop clicked
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

// --------------------------------------------------------------------------
// 📝 Markdown Export Modal Controllers & Listeners
// --------------------------------------------------------------------------
const exportModal = document.getElementById('markdown-export-overlay');
const exportTextarea = document.getElementById('markdown-export-text');

// Generate beautiful Markdown exclusively from active thought dewdrops on the canvas
function generateMarkdownFromCanvas() {
  const activeCard = document.querySelector('.active-canvas .canvas-item-title');
  const projectTitle = activeCard ? activeCard.textContent : (currentLanguage === 'ko' ? '기본 생각 지도' : 'Default Mind Map');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  let md = "";
  if (currentLanguage === 'ko') {
    md += `# 💧 ${projectTitle} - 생각 물방울 내보내기\n\n`;
    md += `* **추출 일시**: ${dateStr}\n`;
    md += `* **총 생각 물방울**: ${memos.length}개\n\n`;
    md += `---\n\n`;
    md += `## 🧠 활성화된 생각 물방울 목록\n\n`;
    
    if (memos.length === 0) {
      md += `*캔버스에 활성화된 생각 물방울이 존재하지 않습니다.*\n\n`;
    } else {
      memos.forEach((m, idx) => {
        md += `### 📍 생각 물방울 #${idx + 1} (${m.date})\n\n`;
        const formattedText = m.text.split('\n').map(line => line.trim()).join('\n');
        md += `${formattedText}\n\n`;
      });
    }
  } else {
    md += `# 💧 ${projectTitle} - Thought Board Export\n\n`;
    md += `* **Exported At**: ${dateStr}\n`;
    md += `* **Total Thought Dewdrops**: ${memos.length} nodes\n\n`;
    md += `---\n\n`;
    md += `## 🧠 Active Thought Dewdrops\n\n`;
    
    if (memos.length === 0) {
      md += `*No active thought dewdrops exist on the canvas.*\n\n`;
    } else {
      memos.forEach((m, idx) => {
        md += `### 📍 Thought Dewdrop #${idx + 1} (${m.date})\n\n`;
        const formattedText = m.text.split('\n').map(line => line.trim()).join('\n');
        md += `${formattedText}\n\n`;
      });
    }
  }
  
  return md;
}

// Open Export Modal
document.getElementById('export-markdown-btn').addEventListener('click', () => {
  if (memos.length === 0) {
    showToast(I18N_DICTIONARY[currentLanguage].toastExportEmpty, 'warning');
    return;
  }
  const generatedMd = generateMarkdownFromCanvas();
  exportTextarea.value = generatedMd;
  exportModal.classList.add('active');
  exportTextarea.focus();
});

// Close Export Modal
document.getElementById('export-markdown-close').addEventListener('click', () => {
  exportModal.classList.remove('active');
});

// Close if backdrop clicked
exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
    exportModal.classList.remove('active');
  }
});

// Copy Markdown to Clipboard
document.getElementById('export-markdown-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(exportTextarea.value)
    .then(() => {
      showToast(I18N_DICTIONARY[currentLanguage].toastExportCopied, 'success');
    })
    .catch(err => {
      console.error('Failed to copy text:', err);
    });
});

// Download Markdown File
document.getElementById('export-markdown-download').addEventListener('click', () => {
  const blob = new Blob([exportTextarea.value], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const activeCard = document.querySelector('.active-canvas .canvas-item-title');
  const rawTitle = activeCard ? activeCard.textContent.trim() : 'thoughts';
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_').replace(/\s+/g, '_');
  
  link.setAttribute('download', `${cleanTitle}_export.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// Clear Thought Fusion History Logs
document.getElementById('clear-history-btn').addEventListener('click', () => {
  const historyList = document.getElementById('history-list');
  // Check if there is anything to clear (meaning not empty)
  if (historyList.querySelector('.empty-history')) {
    return;
  }
  
  if (confirm(I18N_DICTIONARY[currentLanguage].toastClearHistoryConfirm)) {
    pushUndoState(); // Store rollback point before clearing history!
    
    // Clear list and inject empty fallback state
    historyList.innerHTML = `<div class="empty-history">${I18N_DICTIONARY[currentLanguage].emptyHistory}</div>`;
    
    // Auto-save the cleared history state to the project database
    saveProjectState();
    
    playPlopSound();
    showToast(I18N_DICTIONARY[currentLanguage].toastHistoryCleared, 'info');
  }
});

// AI Auto-Merge Selection & Snapping Action Bindings
document.getElementById('ai-auto-merge-btn').addEventListener('click', async () => {
  const btn = document.getElementById('ai-auto-merge-btn');
  
  // 1. Min memos check
  if (memos.length < 2) {
    showToast(I18N_DICTIONARY[currentLanguage].toastMinMemosRequired, 'warning');
    return;
  }

  // Prevent double clicks or overlaps
  if (btn.disabled || memos.some(m => m.isMerging || m.aiAutoMerging)) return;

  btn.disabled = true;
  btn.style.animation = 'pulse-orange 1.0s infinite alternate ease-in-out';
  showToast(I18N_DICTIONARY[currentLanguage].toastAutoMergeAnalyzing, 'info');

  const apiKey = apiKeyInput.value.trim();
  const provider = aiProviderSelect.value;
  
  // Extract simple list of active dewdrops
  const activeMemos = memos.map(m => ({ id: m.id, text: m.text }));

  try {
    const res = await fetch('/api/recommend-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memos: activeMemos,
        customApiKey: apiKey,
        provider,
        language: currentLanguage
      })
    });

    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.success && data.idA && data.idB) {
      // Find the memos in client memory
      const mA = memos.find(m => m.id === data.idA);
      const mB = memos.find(m => m.id === data.idB);

      if (mA && mB) {
        // Show AI reasoning in a gorgeous toast
        showToast(data.reason, 'success');
        playPlopSound();

        // Flag nodes to begin the dynamic physics attraction pull!
        mA.aiAutoMerging = true;
        mB.aiAutoMerging = true;

        // Visual highlights on cards to show they are selected
        const cardA = document.getElementById(mA.id);
        const cardB = document.getElementById(mB.id);
        if (cardA) cardA.style.boxShadow = '0 0 35px var(--card-core-color, var(--primary))';
        if (cardB) cardB.style.boxShadow = '0 0 35px var(--card-core-color, var(--primary))';
      } else {
        throw new Error();
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    console.error('AI Recommend Merge failed:', err);
    showToast(I18N_DICTIONARY[currentLanguage].toastAutoMergeFail, 'warning');
  } finally {
    btn.disabled = false;
    btn.style.animation = '';
  }
});

// --------------------------------------------------------------------------
// 6. AI Thought Synthesis Engine (Secure Backend Multi-LLM API Wrapper)
// --------------------------------------------------------------------------
const synthesisOverlay = document.getElementById('synthesis-overlay');
const stepExtract = document.getElementById('step-extract');
const stepSynthesis = document.getElementById('step-synthesis');
const stepEnhance = document.getElementById('step-enhance');

function triggerSynthesisMerge(mA, mB) {
  pushUndoState(); // Store current state for ROLLBACK capabilities!
  
  // Track IDs for physics separation on rollback
  lastMergedIds = [mA.id, mB.id];

  // Set explicit safety flags to prevent double trigger loops during async completion stages!
  mA.isMerging = true;
  mB.isMerging = true;

  // Flag cards as active AI thinking (No full-screen popups!)
  const elA = document.getElementById(mA.id);
  const elB = document.getElementById(mB.id);
  if (elA) elA.classList.add('ai-thinking');
  if (elB) elB.classList.add('ai-thinking');
  
  // Suspend physics dragging
  draggingMemo = null;
  mA.isDragging = false;
  mB.isDragging = false;
  
  // Play droplet snap sound
  playPlopSound();
  
  const midX = (mA.x + mB.x) / 2;
  const midY = (mA.y + mB.y) / 2;
  
  const apiKey = apiKeyInput.value.trim();
  const provider = aiProviderSelect.value;
  const textA = mA.text;
  const textB = mB.text;
  
  // Securely call server proxy endpoint for synthesis and execute immediately
  runSecureServerAISynthesis(textA, textB, apiKey, provider)
    .then(responseData => {
      const resultText = responseData.text;
      
      // Complete merge! Delete the two old cards
      if (elA) elA.remove();
      if (elB) elB.remove();
      memos = memos.filter(m => m.id !== mA.id && m.id !== mB.id);
      
      // Create new larger unified dewdrop at midpoint (with customized radius representation)
      const newRadius = Math.min(135, Math.max(mA.radius, mB.radius) + 12);
      createDewdrop(resultText, midX, midY, null, null, newRadius);
      
      // Add record to history sidebar
      appendHistoryItem(textA, textB, resultText);
      
      // Play crystal triumph chime
      playChimeSound();
      
      // Toast status tailored to model
      const undoAction = { text: I18N_DICTIONARY[currentLanguage].toastUndo, callback: rollback };
      if (responseData.mode === 'gemini') {
        showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisGemini, 'success', undoAction);
      } else if (responseData.mode === 'deepseek') {
        showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisDeepseek, 'success', undoAction);
      } else if (responseData.mode === 'openrouter') {
        showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisOpenrouter, 'success', undoAction);
      } else if (responseData.mode.includes('fallback')) {
        showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisFallback, 'warning', undoAction);
      } else {
        showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisSimulator, 'info', undoAction);
      }
      
      // Auto-save project state
      saveProjectState();
    })
    .catch(err => {
      console.error('AI Synthesis Failed:', err);
      
      // Fail-safe: Combine notes rawly if error occurs
      const fallbackText = currentLanguage === 'ko'
        ? `### 융합된 생각\n${textA}\n\n${textB}\n\n### AI의 창의적 시너지\n두 생각을 유기적으로 병합하는 도중 네트워크 통신 에러가 발생하여 개별 생각을 단순 안전 병합했습니다.`
        : `### Synthesized Thought\n${textA}\n\n${textB}\n\n### AI Creative Synergy\nAn error occurred while organically merging the thoughts, so a simple safe merge was processed.`;
      
      if (elA) elA.remove();
      if (elB) elB.remove();
      memos = memos.filter(m => m.id !== mA.id && m.id !== mB.id);
      
      createDewdrop(fallbackText, midX, midY);
      appendHistoryItem(textA, textB, fallbackText);
      saveProjectState(); // Auto-save active state
      
      showToast(I18N_DICTIONARY[currentLanguage].toastSynthesisFallbackMerge, 'warning', { text: I18N_DICTIONARY[currentLanguage].toastUndo, callback: rollback });
    });
}

// 🌐 Call Secure Server API Synth (updated with provider)
async function runSecureServerAISynthesis(textA, textB, customApiKey, provider) {
  const res = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      textA,
      textB,
      customApiKey,
      provider,
      language: currentLanguage
    })
  });

  if (!res.ok) {
    throw new Error('Server synthesis API failure');
  }

  return await res.json();
}

// History List Handler with robust multi-prompt splitters
function appendHistoryItem(textA, textB, resultText) {
  const historyList = document.getElementById('history-list');
  const empty = historyList.querySelector('.empty-history');
  if (empty) empty.remove();
  
  const item = document.createElement('div');
  item.className = 'history-item';
  
  const titleA = currentLanguage === 'ko' ? '융합 전 생각 A' : 'Thought A before Fusion';
  const titleB = currentLanguage === 'ko' ? '융합 전 생각 B' : 'Thought B before Fusion';
  const titleHeader = currentLanguage === 'ko' ? '융합 상세 역사' : 'Fusion History Details';
  
  item.setAttribute('data-full', `[${titleHeader}]\n\n[${titleA}]\n: ${textA}\n\n[${titleB}]\n: ${textB}\n\n${resultText}`);
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  // Robustly handle different splitter formats from various LLM providers (Gemini, DeepSeek, OpenRouter)
  let splitter = '### AI';
  if (resultText.includes('### AI의 창의적 시너지')) {
    splitter = '### AI의 창의적 시너지';
  } else if (resultText.includes('### AI Creative Synergy')) {
    splitter = '### AI Creative Synergy';
  } else if (resultText.includes('### AI의 논리적 확장/보완')) {
    splitter = '### AI의 논리적 확장/보완';
  } else if (resultText.includes('### AI')) {
    splitter = '### AI';
  }
  
  // Extract only the merged thought for sidebar preview
  const mergedPart = resultText.split(splitter)[0]
                               .replace('### 융합된 생각', '')
                               .replace('### Synthesized Thought', '')
                               .replace('### 보강된 생각', '')
                               .replace('### Enhanced Thought', '')
                               .replace(/\n/g, '')
                               .trim();
  
  item.innerHTML = `
    <div class="history-item-header">
      <span>${currentLanguage === 'ko' ? '융합 완료' : 'Fusion Completed'}</span>
      <span>${timeStr}</span>
    </div>
    <div class="history-item-body" title="${mergedPart}">
      ${mergedPart}
    </div>
  `;
  
  item.addEventListener('click', () => {
    alert(`[${titleHeader}]\n\n[${titleA}]\n: ${textA}\n\n[${titleB}]\n: ${textB}\n\n${resultText}`);
  });
  
  historyList.insertBefore(item, historyList.firstChild);
}

// --------------------------------------------------------------------------
// 7. Initial startup seeds & active canvas loop launch
// --------------------------------------------------------------------------
(async function init() {
  applyLanguage(currentLanguage);
  detectServerApiKey();
  await loadActiveProjectOnStart();
  await fetchProjects();
  
  // Center the scrollable board in the viewport on startup
  const scrollWrapper = document.getElementById('board-scroll-wrapper');
  if (scrollWrapper) {
    scrollWrapper.scrollLeft = (2400 - scrollWrapper.clientWidth) / 2;
    scrollWrapper.scrollTop = (1800 - scrollWrapper.clientHeight) / 2;
  }
  
  // Check if we just restored a project to apply startup merge immunity
  const justRestored = localStorage.getItem('dewdrop_just_restored');
  if (justRestored === 'true') {
    memos.forEach(m => {
      m.mergeImmunity = true;
      setTimeout(() => {
        m.mergeImmunity = false;
      }, 3500); // 3.5 seconds immunity
    });
    localStorage.removeItem('dewdrop_just_restored');
  }
  
  physicsLoop();
})();
