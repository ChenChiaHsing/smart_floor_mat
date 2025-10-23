// 地墊模擬器 - 主要JavaScript功能
// Floor Mat Simulator - Main JavaScript Functions

// 語言管理類
// Language Manager Class
class LanguageManager {
    constructor() {
        this.currentLang = 'zh';
        this.translations = {
            zh: {
                'page-title': '地墊模擬器',
                'title': '智慧健康地墊模擬系統',
                'subtitle': '國立臺北科技大學 智慧空間互動程式設計',
                'record-title': '踩踏記錄',
                'no-records': '尚無踩踏記錄',
                'clear-log': '清除記錄',
                'toolbox': '工具箱',
                'mat-materials': '地墊素材',
                'floor-mat': '地墊',
                'info': '資訊',
                'grid-size': '網格大小',
                'placed': '已放置',
                'mats': '個地墊',
                'groups': '群組數量',
                'groups-unit': '個',
                'zoom-control': '縮放控制',
                'zoom-in': '放大 (+)',
                'zoom-out': '縮小 (-)',
                'reset-zoom': '重設縮放',
                'zoom': '縮放',
                'zoom-label': '縮放',
                'university': '國立臺北科技大學 互動設計系',
                'author': '陳家興',
                // 記錄相關 / Record Related
                'group-label': '群組',
                'number-label': '編號',
                // 動態訊息 / Dynamic Messages
                'drag-message': '拖曳地墊到新位置',
                'position-occupied': '此位置已有地墊！',
                'mat-placed': '地墊已放置！雙擊可刪除',
                'target-occupied': '目標位置已有地墊！',
                'mat-moved': '地墊已移動！',
                'mat-removed': '地墊已移除！',
                'all-mats-cleared': '所有地墊已清除！',
                'log-cleared': '記錄已清除！',
                'config-imported': '配置已匯入！',
                'ready-message': '地墊模擬器已準備就緒！'
            },
            en: {
                'page-title': 'Floor Mat Simulator',
                'title': 'Smart Health Floor Mat Simulation System',
                'subtitle': 'National Taipei University of Technology - Interaction Design and Programming in a Smart Space',
                'record-title': 'Step Records',
                'no-records': 'No step records yet',
                'clear-log': 'Clear Log',
                'toolbox': 'Toolbox',
                'mat-materials': 'Mat Materials',
                'floor-mat': 'Floor Mat',
                'info': 'Information',
                'grid-size': 'Grid Size',
                'placed': 'Placed',
                'mats': 'mats',
                'groups': 'Groups',
                'groups-unit': ' ',
                'zoom-control': 'Zoom Control',
                'zoom-in': 'Zoom In (+)',
                'zoom-out': 'Zoom Out (-)',
                'reset-zoom': 'Reset Zoom',
                'zoom': 'Zoom',
                'zoom-label': 'Zoom',
                'university': 'National Taipei University of Technology - Department of Interaction Design',
                'author': 'Chia-Hsing Chen',
                // 記錄相關 / Record Related
                'group-label': 'Group',
                'number-label': 'Number',
                // 動態訊息 / Dynamic Messages
                'drag-message': 'Drag mat to new position',
                'position-occupied': 'Position already occupied!',
                'mat-placed': 'Mat placed! Double-click to remove',
                'target-occupied': 'Target position already occupied!',
                'mat-moved': 'Mat moved!',
                'mat-removed': 'Mat removed!',
                'all-mats-cleared': 'All mats cleared!',
                'log-cleared': 'Log cleared!',
                'config-imported': 'Configuration imported!',
                'ready-message': 'Floor mat simulator is ready!'
            }
        };
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.updateUI();
        this.updateLangButton();
        localStorage.setItem('floor-mat-lang', this.currentLang);
    }

    updateUI() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translations[this.currentLang][key];
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    updateLangButton() {
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        }
    }

    getText(key) {
        return this.translations[this.currentLang][key] || key;
    }

    init() {
        // 從localStorage載入語言設定
        const savedLang = localStorage.getItem('floor-mat-lang');
        if (savedLang && this.translations[savedLang]) {
            this.currentLang = savedLang;
        }
        
        this.updateUI();
        this.updateLangButton();
        
        // 綁定語言切換按鈕事件
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.addEventListener('click', () => this.switchLanguage());
        }
    }
}

class FloorMatSimulator {
    constructor() {
        // 語言管理器 / Language Manager
        this.langManager = new LanguageManager();
        
        // DOM元素 / DOM Elements
        this.gridArea = document.getElementById('grid-area');
        
        // 縮放相關設定 / Zoom Related Settings
        this.zoomLevel = 1;
        this.ZOOM_SETTINGS = {
            MIN: 0.5,
            MAX: 3,
            STEP: 0.1
        };
        
        // 網格設定 / Grid Settings
        this.gridCols = 8;
        this.gridRows = 8;
        this.placedMats = 0;
        
        // 群組資訊 / Group Information
        this.groups = [];
        this.isDraggingExistingMat = false;
        
        // 動畫常數 / Animation Constants
        this.ANIMATION_COLORS = {
            HIGHLIGHT: '#2471ed',
            DEFAULT: '#ffffff'
        };
        
        this.ANIMATION_TIMING = {
            FADE_IN: 1000,  // 漸入時間 (ms) / Fade in duration (ms)
            FADE_OUT: 3000, // 漸出時間 (ms) / Fade out duration (ms)
            MESSAGE_AUTO_HIDE: 3000, // 訊息自動隱藏時間 (ms) / Message auto hide duration (ms)
            SLIDE_ANIMATION: 300, // 訊息滑動動畫時間 (ms) / Message slide animation duration (ms)
            DOUBLE_CLICK_DELAY: 300 // 雙擊檢測延遲 (ms) / Double click detection delay (ms)
        };
        
        // 訊息顏色設定 / Message Color Settings
        this.MESSAGE_COLORS = {
            SUCCESS: '#27ae60',
            WARNING: '#f39c12',
            ERROR: '#e74c3c',
            INFO: '#3498db'
        };
        
        // 訊息樣式設定 / Message Style Settings
        this.MESSAGE_STYLES = {
            POSITION_TOP: '20px',
            POSITION_RIGHT: '20px',
            PADDING: '12px 20px',
            BORDER_RADIUS: '4px',
            Z_INDEX: '10000',
            BOX_SHADOW: '0 4px 8px rgba(0,0,0,0.2)'
        };
        
        // 色彩映射設定 / Color Mapping Settings
        this.COLOR_MAP = {
            SATURATION: 70,
            LIGHTNESS: 50,
            HUE_RANGE: 300,
            SINGLE_GROUP_HUE_STEP: 60
        };
        
        // UI顏色設定 / UI Color Settings
        this.UI_COLORS = {
            LOG_TIME: '#2c3e50'
        };
        
        // 佈局常數 / Layout Constants
        this.LAYOUT = {
            LOG_MARGIN_TOP: '2px'
        };
        
        this.init();
    }
    
    // Rainbow colormap函數 - 根據群組索引產生彩虹色
    // Rainbow colormap function - Generate rainbow colors based on group index
    getRainbowColor(groupIndex, totalGroups) {
        // 將群組索引映射到0-1之間，即使只有一個群組也使用colormap
        // Map group index to 0-1 range, using colormap even for single group
        const hue = totalGroups <= 1 ? 
            (groupIndex * this.COLOR_MAP.SINGLE_GROUP_HUE_STEP) % 360 : 
            (groupIndex / Math.max(1, totalGroups - 1)) * this.COLOR_MAP.HUE_RANGE;
        
        return `hsl(${hue}, ${this.COLOR_MAP.SATURATION}%, ${this.COLOR_MAP.LIGHTNESS}%)`;
    }
    
    init() {
        this.langManager.init();
        this.createGrid();
        this.bindEvents();
        this.updateUI();
    }
    
    // 創建網格 / Create Grid
    createGrid() {
        this.gridArea.innerHTML = '';
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加拖放事件監聽器 / Add drag and drop event listeners
                cell.addEventListener('dragover', this.handleDragOver.bind(this));
                cell.addEventListener('drop', this.handleDrop.bind(this));
                cell.addEventListener('dragleave', this.handleDragLeave.bind(this));
                
                this.gridArea.appendChild(cell);
            }
        }
    }
    
    // 綁定事件 / Bind Events
    bindEvents() {
        // 縮放按鈕 / Zoom Buttons
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-zoom').addEventListener('click', () => this.resetZoom());
        
        // 地墊拖曳 / Mat Dragging
        document.querySelector('.mat-item').addEventListener('dragstart', this.handleDragStart.bind(this));
        document.querySelector('.mat-item').addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // 清除記錄按鈕 / Clear Log Button
        document.getElementById('clear-log').addEventListener('click', this.clearOutputLog.bind(this));
        
        // 右鍵菜單（移除地墊）/ Right-click Menu (Remove Mat)
        this.gridArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.grid-cell');
            if (cell && cell.classList.contains('occupied')) {
                this.removeMat(cell, true); // 右鍵刪除需要確認 / Right-click removal requires confirmation
            }
        });
        
        // 鍵盤快捷鍵 / Keyboard Shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 滑鼠滾輪縮放 / Mouse Wheel Zoom
        this.gridArea.addEventListener('wheel', this.handleWheel.bind(this));
        
        // 網格拖曳（當縮放時）/ Grid Dragging (When Zoomed)
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        
        this.gridArea.parentElement.addEventListener('mousedown', (e) => {
            if (this.zoomLevel > 1) {
                isDragging = true;
                startX = e.pageX - this.gridArea.parentElement.offsetLeft;
                startY = e.pageY - this.gridArea.parentElement.offsetTop;
                scrollLeft = this.gridArea.parentElement.scrollLeft;
                scrollTop = this.gridArea.parentElement.scrollTop;
                this.gridArea.parentElement.classList.add('zoomed');
            }
        });
        
        this.gridArea.parentElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - this.gridArea.parentElement.offsetLeft;
            const y = e.pageY - this.gridArea.parentElement.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            this.gridArea.parentElement.scrollLeft = scrollLeft - walkX;
            this.gridArea.parentElement.scrollTop = scrollTop - walkY;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.gridArea.parentElement.classList.remove('zoomed');
        });
    }
    
    // 拖曳開始 / Drag Start
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.mat);
        e.target.classList.add('dragging');
        this.isDraggingExistingMat = false;
    }
    
    // 地墊拖曳開始 / Mat Drag Start
    handleMatDragStart(e, sourceCell) {
        e.dataTransfer.setData('text/plain', 'existing_mat');
        e.dataTransfer.setData('source-row', sourceCell.dataset.row);
        e.dataTransfer.setData('source-col', sourceCell.dataset.col);
        e.target.classList.add('dragging');
        sourceCell.classList.add('dragging-source');
        this.isDraggingExistingMat = true;
        this.showMessage(this.langManager.getText('drag-message'), 'info');
    }
    
    // 地墊拖曳結束 / Mat Drag End
    handleMatDragEnd(e, sourceCell) {
        e.target.classList.remove('dragging');
        sourceCell.classList.remove('dragging-source');
        this.isDraggingExistingMat = false;
        
        // 移除所有拖曳相關的樣式 / Remove all drag-related styles
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('drag-over', 'dragging-source');
        });
    }
    
    // 拖曳結束 / Drag End
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    // 拖曳懸停 / Drag Over
    handleDragOver(e) {
        e.preventDefault();
        const cell = e.currentTarget;
        
        // 如果格子已被占用，不顯示拖曳效果 / Don't show drag effect if cell is occupied
        if (!cell.classList.contains('occupied')) {
            cell.classList.add('drag-over');
        }
    }
    
    // 拖曳離開 / Drag Leave
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    // 放置 / Drop
    handleDrop(e) {
        e.preventDefault();
        const cell = e.currentTarget;
        const matType = e.dataTransfer.getData('text/plain');
        
        cell.classList.remove('drag-over');
        
        if (matType === 'existing_mat') {
            // 移動現有地墊 / Move existing mat
            const sourceRow = e.dataTransfer.getData('source-row');
            const sourceCol = e.dataTransfer.getData('source-col');
            const sourceCell = document.querySelector(`[data-row="${sourceRow}"][data-col="${sourceCol}"]`);
            
            if (sourceCell && sourceCell !== cell) {
                this.moveMatTo(sourceCell, cell);
            }
        } else {
            // 檢查格子是否已被占用 / Check if cell is already occupied
            if (cell.classList.contains('occupied')) {
                this.showMessage(this.langManager.getText('position-occupied'), 'warning');
                return;
            }
            
            // 放置新地墊 / Place new mat
            this.placeMat(cell, matType);
        }
    }
    
    // 放置地墊 / Place Mat
    placeMat(cell, matType) {
        cell.classList.add('occupied');
        cell.innerHTML = `<div class="mat-placed" draggable="true">
            <span class="mat-number">0</span>
        </div>`;
        
        // 添加雙擊事件 / Add double-click event
        const matElement = cell.querySelector('.mat-placed');
        let clickCount = 0;
        let clickTimer = null;
        
        matElement.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
            
            if (clickCount === 1) {
                // 單擊處理 / Single click handling
                clickTimer = setTimeout(() => {
                    this.onMatClick(cell);
                    clickCount = 0;
                }, this.ANIMATION_TIMING.DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                // 雙擊處理 / Double click handling
                clearTimeout(clickTimer);
                this.removeMat(cell);
                clickCount = 0;
            }
        });
        
        // 添加拖曳事件 / Add drag events
        matElement.addEventListener('dragstart', (e) => {
            this.handleMatDragStart(e, cell);
        });
        
        matElement.addEventListener('dragend', (e) => {
            this.handleMatDragEnd(e, cell);
        });
        
        this.placedMats++;
        this.updateGroups();
        this.updateMatNumbers(); // 重新計算所有地墊編號 / Recalculate all mat numbers
        this.updateUI();
        this.showMessage(this.langManager.getText('mat-placed'), 'success');
    }
    
    // 移動地墊到新位置 / Move Mat to New Position
    moveMatTo(sourceCell, targetCell) {
        if (targetCell.classList.contains('occupied')) {
            this.showMessage(this.langManager.getText('target-occupied'), 'warning');
            return;
        }
        
        // 移除源位置的地墊 / Remove mat from source position
        const matElement = sourceCell.querySelector('.mat-placed');
        
        // 清除源位置的高亮計時器 / Clear highlight timers from source position
        if (sourceCell.highlightTimer) {
            clearTimeout(sourceCell.highlightTimer);
            sourceCell.highlightTimer = null;
        }
        if (sourceCell.fadeTimer) {
            clearTimeout(sourceCell.fadeTimer);
            sourceCell.fadeTimer = null;
        }
        
        sourceCell.classList.remove('occupied', 'highlighted', 'fading');
        delete sourceCell.dataset.matNumber;
        delete sourceCell.dataset.groupId;
        sourceCell.innerHTML = '';
        
        // 在目標位置放置地墊 / Place mat at target position
        targetCell.classList.add('occupied');
        targetCell.innerHTML = `<div class="mat-placed" draggable="true">
            <span class="mat-number">0</span>
        </div>`;
        
        // 為新位置的地墊添加事件 / Add events for mat at new position
        const newMatElement = targetCell.querySelector('.mat-placed');
        let clickCount = 0;
        let clickTimer = null;
        
        newMatElement.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    this.onMatClick(targetCell);
                    clickCount = 0;
                }, this.ANIMATION_TIMING.DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                this.removeMat(targetCell);
                clickCount = 0;
            }
        });
        
        newMatElement.addEventListener('dragstart', (e) => {
            this.handleMatDragStart(e, targetCell);
        });
        
        newMatElement.addEventListener('dragend', (e) => {
            this.handleMatDragEnd(e, targetCell);
        });
        
        // 重新計算群組和編號 / Recalculate groups and numbers
        this.updateGroups();
        this.updateMatNumbers();
        this.updateUI();
        this.showMessage(this.langManager.getText('mat-moved'), 'success');
    }
    
    // 地墊點擊事件 / Mat Click Event
    onMatClick(cell) {
        const groupInfo = this.findMatGroupInfo(cell);
        const currentTime = new Date().toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        this.addOutputRecord(currentTime, groupInfo.groupId, groupInfo.matNumber);
        
        // 高亮顯示單個地墊 / Highlight single mat
        this.highlightSingleMat(cell);
    }
    
    // 更新所有地墊編號（群組內從1開始）/ Update All Mat Numbers (Starting from 1 within groups)
    updateMatNumbers() {
        // 首先清除所有群組樣式 / First clear all group styles
        const allCells = document.querySelectorAll('.grid-cell');
        allCells.forEach(cell => {
            cell.classList.remove('in-group', 'group-border-top', 'group-border-bottom', 
                                'group-border-left', 'group-border-right');
            const existingLabel = cell.querySelector('.group-label');
            if (existingLabel) {
                existingLabel.remove();
            }
            // 清除自定義樣式 / Clear custom styles
            cell.style.removeProperty('--group-color');
        });

        // 計算多群組的總數（用於rainbow colormap）/ Calculate total number of multi-groups (for rainbow colormap)
        const multiGroups = this.groups.filter(group => group.size > 1);
        const totalMultiGroups = multiGroups.length;

        this.groups.forEach((group, groupIndex) => {
            if (group.size > 1) { // 只有多於一個地墊的群組才顯示群組效果 / Only show group effects for groups with more than one mat
                // 獲取群組在多群組中的索引 / Get group index in multi-groups
                const multiGroupIndex = multiGroups.findIndex(g => g === group);
                const groupColor = this.getRainbowColor(multiGroupIndex, totalMultiGroups);
                
                // 創建群組位置的查找表 / Create lookup table for group positions
                const groupPositions = new Set();
                group.positions.forEach(pos => {
                    groupPositions.add(`${pos.row}-${pos.col}`);
                });

                group.positions.forEach((pos, posIndex) => {
                    const cell = document.querySelector(
                        `[data-row="${pos.row}"][data-col="${pos.col}"]`
                    );
                    if (cell) {
                        const matNumber = posIndex + 1;
                        cell.dataset.matNumber = matNumber;
                        cell.dataset.groupId = groupIndex + 1;
                        
                        // 添加群組基本樣式
                        cell.classList.add('in-group');
                        
                        // 設置群組顏色CSS變數
                        cell.style.setProperty('--group-color', groupColor);
                        
                        // 檢查四個方向是否需要顯示邊框
                        const row = pos.row;
                        const col = pos.col;
                        
                        // 檢查上邊
                        if (!groupPositions.has(`${row-1}-${col}`)) {
                            cell.classList.add('group-border-top');
                        }
                        
                        // 檢查下邊
                        if (!groupPositions.has(`${row+1}-${col}`)) {
                            cell.classList.add('group-border-bottom');
                        }
                        
                        // 檢查左邊
                        if (!groupPositions.has(`${row}-${col-1}`)) {
                            cell.classList.add('group-border-left');
                        }
                        
                        // 檢查右邊
                        if (!groupPositions.has(`${row}-${col+1}`)) {
                            cell.classList.add('group-border-right');
                        }
                        
                        // 只在群組的第一個地墊(左上角)顯示群組標籤
                        if (posIndex === 0) {
                            const groupLabel = document.createElement('div');
                            groupLabel.className = 'group-label';
                            groupLabel.textContent = `G${groupIndex + 1}`;
                            groupLabel.style.backgroundColor = groupColor;
                            cell.appendChild(groupLabel);
                        }
                        
                        const numberSpan = cell.querySelector('.mat-number');
                        if (numberSpan) {
                            numberSpan.textContent = matNumber;
                        }
                        
                        const matElement = cell.querySelector('.mat-placed');
                        if (matElement) {
                            matElement.title = `群組 ${groupIndex + 1} - 地墊 ${matNumber} (雙擊刪除)`;
                            matElement.draggable = true;
                        }
                    }
                });
            } else {
                // 單個地墊的群組
                const pos = group.positions[0];
                const cell = document.querySelector(
                    `[data-row="${pos.row}"][data-col="${pos.col}"]`
                );
                if (cell) {
                    cell.dataset.matNumber = 1;
                    cell.dataset.groupId = groupIndex + 1;
                    
                    const numberSpan = cell.querySelector('.mat-number');
                    if (numberSpan) {
                        numberSpan.textContent = 1;
                    }
                    
                    const matElement = cell.querySelector('.mat-placed');
                    if (matElement) {
                        matElement.title = `群組 ${groupIndex + 1} - 地墊 1 (雙擊刪除)`;
                        matElement.draggable = true;
                    }
                }
            }
        });
    }
    
    // 找到地墊所屬群組資訊
    findMatGroupInfo(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        for (let i = 0; i < this.groups.length; i++) {
            const group = this.groups[i];
            for (let j = 0; j < group.positions.length; j++) {
                const pos = group.positions[j];
                if (pos.row === row && pos.col === col) {
                    return {
                        groupId: i + 1, // 群組編號從1開始
                        matNumber: j + 1 // 群組內地墊編號從1開始
                    };
                }
            }
        }
        return { groupId: 0, matNumber: 0 }; // 未找到群組
    }
    
    // 更新群組資訊
    updateGroups() {
        this.groups = [];
        const visited = new Set();
        const occupiedCells = document.querySelectorAll('.grid-cell.occupied');
        
        occupiedCells.forEach(cell => {
            const key = `${cell.dataset.row}-${cell.dataset.col}`;
            if (!visited.has(key)) {
                const group = this.findConnectedGroup(cell, visited);
                if (group.length > 0) {
                    // 按照由左至右、由上至下的順序排序
                    group.sort((a, b) => {
                        if (a.row !== b.row) {
                            return a.row - b.row; // 先按行排序
                        }
                        return a.col - b.col; // 再按列排序
                    });
                    
                    this.groups.push({
                        positions: group,
                        size: group.length
                    });
                }
            }
        });
        
        // 按群組左上角位置排序群組
        this.groups.sort((a, b) => {
            const aFirst = a.positions[0];
            const bFirst = b.positions[0];
            if (aFirst.row !== bFirst.row) {
                return aFirst.row - bFirst.row;
            }
            return aFirst.col - bFirst.col;
        });
    }
    
    // 找到連接的群組（深度優先搜索）
    findConnectedGroup(startCell, visited) {
        const group = [];
        const stack = [startCell];
        
        while (stack.length > 0) {
            const cell = stack.pop();
            const key = `${cell.dataset.row}-${cell.dataset.col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            group.push({ row, col, cell });
            
            // 檢查四個方向的相鄰格子
            const directions = [
                [-1, 0], [1, 0], [0, -1], [0, 1] // 上、下、左、右
            ];
            
            directions.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                const neighborKey = `${newRow}-${newCol}`;
                
                if (!visited.has(neighborKey)) {
                    const neighbor = document.querySelector(
                        `[data-row="${newRow}"][data-col="${newCol}"].occupied`
                    );
                    if (neighbor) {
                        stack.push(neighbor);
                    }
                }
            });
        }
        
        return group;
    }
    
    // 高亮單個地墊 / Highlight Single Mat
    highlightSingleMat(cell) {
        // 清除任何現有的計時器 / Clear any existing timers
        if (cell.highlightTimer) {
            clearTimeout(cell.highlightTimer);
            cell.highlightTimer = null;
        }
        if (cell.fadeTimer) {
            clearTimeout(cell.fadeTimer);
            cell.fadeTimer = null;
        }
        
        // 完全清除所有樣式和類別 / Completely clear all styles and classes
        cell.classList.remove('highlighted', 'fading');
        cell.style.cssText = '';
        
        // 強制重繪 / Force repaint
        cell.offsetHeight;
        
        // 第一階段：1秒從白色漸變到藍色 / Phase 1: 1 second fade from white to blue
        cell.style.backgroundColor = this.ANIMATION_COLORS.DEFAULT;
        cell.style.transition = `background-color ${this.ANIMATION_TIMING.FADE_IN}ms ease-in-out`;
        cell.style.setProperty('transition', `background-color ${this.ANIMATION_TIMING.FADE_IN}ms ease-in-out`, 'important');
        
        // 強制重繪 / Force repaint
        cell.offsetHeight;
        
        // 用requestAnimationFrame確保在下一個渲染週期改變顏色 / Use requestAnimationFrame to ensure color change in next render cycle
        requestAnimationFrame(() => {
            cell.style.backgroundColor = this.ANIMATION_COLORS.HIGHLIGHT;
            cell.style.setProperty('background-color', this.ANIMATION_COLORS.HIGHLIGHT, 'important');
        });
        
        // 1秒後開始淡出動畫 / Start fade out animation after 1 second
        cell.fadeTimer = setTimeout(() => {
            // 第二階段：3秒從藍色漸變回白色 / Phase 2: 3 seconds fade from blue back to white
            cell.style.transition = `background-color ${this.ANIMATION_TIMING.FADE_OUT}ms ease-in-out`;
            cell.style.setProperty('transition', `background-color ${this.ANIMATION_TIMING.FADE_OUT}ms ease-in-out`, 'important');
            cell.style.backgroundColor = this.ANIMATION_COLORS.DEFAULT;
            cell.style.setProperty('background-color', this.ANIMATION_COLORS.DEFAULT, 'important');
            
            // 3秒後完全清除 / Completely clear after 3 seconds
            cell.highlightTimer = setTimeout(() => {
                cell.style.cssText = '';
                cell.classList.remove('highlighted', 'fading');
                cell.highlightTimer = null;
            }, this.ANIMATION_TIMING.FADE_OUT);
            
            cell.fadeTimer = null;
        }, this.ANIMATION_TIMING.FADE_IN);
    }
    
    // 高亮群組（保留函數以備未來使用）/ Highlight Group (Reserved function for future use)
    highlightGroup(groupId) {
        // 高亮當前群組 / Highlight current group
        if (groupId > 0 && groupId <= this.groups.length) {
            const group = this.groups[groupId - 1];
            group.positions.forEach(pos => {
                const cell = document.querySelector(
                    `[data-row="${pos.row}"][data-col="${pos.col}"]`
                );
                if (cell) {
                    // 如果已經高亮，清除舊計時器
                    if (cell.highlightTimer) {
                        clearTimeout(cell.highlightTimer);
                    }
                    if (cell.fadeTimer) {
                        clearTimeout(cell.fadeTimer);
                    }
                    cell.classList.remove('highlighted', 'fading');
                    
                    // 強制重繪
                    cell.offsetHeight;
                    
                    cell.classList.add('highlighted');
                    
                    // 1秒後開始漸暗
                    cell.fadeTimer = setTimeout(() => {
                        cell.classList.add('fading');
                        cell.fadeTimer = null;
                    }, 1000);
                    
                    // 4秒後完全移除高亮
                    cell.highlightTimer = setTimeout(() => {
                        cell.classList.remove('highlighted', 'fading');
                        cell.highlightTimer = null;
                    }, 4000);
                }
            });
        }
    }
    
    // 添加輸出記錄
    addOutputRecord(time, groupId, matNumber) {
        const outputLog = document.getElementById('output-log');
        const noRecords = outputLog.querySelector('.no-records');
        
        if (noRecords) {
            noRecords.remove();
        }
        
        const record = document.createElement('p');
        record.innerHTML = `
            <div style="font-weight: bold; color: ${this.UI_COLORS.LOG_TIME};">${time}</div>
            <div style="margin-top: ${this.LAYOUT.LOG_MARGIN_TOP};">${this.langManager.getText('group-label')}: ${groupId} | ${this.langManager.getText('number-label')}: ${matNumber}</div>
        `;
        outputLog.appendChild(record);
        
        // 滾動到最新記錄
        outputLog.scrollTop = outputLog.scrollHeight;
        
        // 啟用清除按鈕
        document.getElementById('clear-log').disabled = false;
    }
    
    // 縮放功能 / Zoom Functions
    zoomIn() {
        if (this.zoomLevel < this.ZOOM_SETTINGS.MAX) {
            this.zoomLevel += this.ZOOM_SETTINGS.STEP;
            this.applyZoom();
        }
    }
    
    zoomOut() {
        if (this.zoomLevel > this.ZOOM_SETTINGS.MIN) {
            this.zoomLevel -= this.ZOOM_SETTINGS.STEP;
            this.applyZoom();
        }
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
        // 重置滾動位置 / Reset scroll position
        this.gridArea.parentElement.scrollLeft = 0;
        this.gridArea.parentElement.scrollTop = 0;
    }
    
    applyZoom() {
        this.gridArea.style.transform = `scale(${this.zoomLevel})`;
        this.updateUI();
    }
    
    // 滑鼠滾輪縮放 / Mouse Wheel Zoom
    handleWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }
    }
    
    // 鍵盤快捷鍵 / Keyboard Shortcuts
    handleKeyDown(e) {
        if (e.ctrlKey) {
            switch (e.key) {
                case '=':
                case '+':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetZoom();
                    break;
            }
        }
        
        // 清除所有地墊（Delete鍵）/ Clear all mats (Delete key)
        if (e.key === 'Delete' && e.shiftKey) {
            this.clearAllMats();
        }
    }
    
    // 移除地墊（雙擊或右鍵點擊）/ Remove Mat (Double-click or right-click)
    removeMat(cell, showConfirm = false) {
        if (!showConfirm || confirm('確定要移除這個地墊嗎？')) {
            // 清除該地墊的高亮計時器 / Clear highlight timers for this mat
            if (cell.highlightTimer) {
                clearTimeout(cell.highlightTimer);
                cell.highlightTimer = null;
            }
            if (cell.fadeTimer) {
                clearTimeout(cell.fadeTimer);
                cell.fadeTimer = null;
            }
            
            cell.classList.remove('occupied', 'highlighted', 'fading');
            delete cell.dataset.matNumber;
            delete cell.dataset.groupId;
            cell.innerHTML = '';
            this.placedMats--;
            this.updateGroups();
            this.updateMatNumbers(); // 重新計算編號 / Recalculate numbers
            this.updateUI();
            this.showMessage(this.langManager.getText('mat-removed'), 'info');
        }
    }
    
    // 清除所有地墊 / Clear All Mats
    clearAllMats() {
        if (this.placedMats > 0 && confirm('確定要清除所有地墊嗎？')) {
            const occupiedCells = document.querySelectorAll('.grid-cell.occupied');
            occupiedCells.forEach(cell => {
                // 清除每個地墊的高亮計時器 / Clear highlight timers for each mat
                if (cell.highlightTimer) {
                    clearTimeout(cell.highlightTimer);
                    cell.highlightTimer = null;
                }
                if (cell.fadeTimer) {
                    clearTimeout(cell.fadeTimer);
                    cell.fadeTimer = null;
                }
                
                cell.classList.remove('occupied', 'highlighted', 'fading');
                delete cell.dataset.matNumber;
                delete cell.dataset.groupId;
                cell.innerHTML = '';
            });
            this.placedMats = 0;
            this.groups = [];
            this.updateUI();
            this.showMessage(this.langManager.getText('all-mats-cleared'), 'info');
        }
    }
    
    // 清除輸出記錄 / Clear Output Log
    clearOutputLog() {
        const outputLog = document.getElementById('output-log');
        outputLog.innerHTML = `<p class="no-records">${langManager.getText('no-records')}</p>`;
        document.getElementById('clear-log').disabled = true;
        this.showMessage(this.langManager.getText('log-cleared'), 'info');
    }
    
    // 更新UI / Update UI
    updateUI() {
        // 更新縮放顯示 / Update zoom display
        document.querySelector('.zoom-level').textContent = `${langManager.getText('zoom-label')}: ${Math.round(this.zoomLevel * 100)}%`;
        
        // 更新網格資訊 / Update grid information
        document.getElementById('grid-size').textContent = `${this.gridCols}x${this.gridRows}`;
        document.getElementById('placed-count').textContent = this.placedMats;
        document.getElementById('group-count').textContent = this.groups.length;
        
        // 更新按鈕狀態 / Update button states
        document.getElementById('zoom-in').disabled = this.zoomLevel >= this.ZOOM_SETTINGS.MAX;
        document.getElementById('zoom-out').disabled = this.zoomLevel <= this.ZOOM_SETTINGS.MIN;
    }
    
    // 顯示訊息 / Show Message
    showMessage(message, type = 'info') {
        // 創建訊息元素 / Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: ${this.MESSAGE_STYLES.POSITION_TOP};
            right: ${this.MESSAGE_STYLES.POSITION_RIGHT};
            padding: ${this.MESSAGE_STYLES.PADDING};
            background: ${this.getMessageColor(type)};
            color: white;
            border-radius: ${this.MESSAGE_STYLES.BORDER_RADIUS};
            z-index: ${this.MESSAGE_STYLES.Z_INDEX};
            animation: slideIn 0.3s ease;
            box-shadow: ${this.MESSAGE_STYLES.BOX_SHADOW};
        `;
        
        document.body.appendChild(messageEl);
        
        // 3秒後自動移除 / Auto remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, this.ANIMATION_TIMING.SLIDE_ANIMATION);
        }, this.ANIMATION_TIMING.MESSAGE_AUTO_HIDE);
    }
    
    // 獲取訊息顏色 / Get Message Color
    getMessageColor(type) {
        switch (type) {
            case 'success': return this.MESSAGE_COLORS.SUCCESS;
            case 'warning': return this.MESSAGE_COLORS.WARNING;
            case 'error': return this.MESSAGE_COLORS.ERROR;
            default: return this.MESSAGE_COLORS.INFO;
        }
    }
    
    // 匯出網格配置 / Export Grid Configuration
    exportConfiguration() {
        const configuration = {
            gridSize: { cols: this.gridCols, rows: this.gridRows },
            mats: []
        };
        
        const occupiedCells = document.querySelectorAll('.grid-cell.occupied');
        occupiedCells.forEach(cell => {
            configuration.mats.push({
                row: parseInt(cell.dataset.row),
                col: parseInt(cell.dataset.col),
                type: 'floor_mat'
            });
        });
        
        return configuration;
    }
    
    // 匯入網格配置 / Import Grid Configuration
    importConfiguration(configuration) {
        // 清除現有地墊 / Clear existing mats
        this.clearAllMats();
        
        // 放置地墊 / Place mats
        configuration.mats.forEach(mat => {
            const cell = document.querySelector(`[data-row="${mat.row}"][data-col="${mat.col}"]`);
            if (cell) {
                this.placeMat(cell, mat.type);
            }
        });
        
        this.showMessage(this.langManager.getText('config-imported'), 'success');
    }
}

// 動畫樣式 / Animation Styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化應用程式 / Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new FloorMatSimulator();
    
    // 將模擬器實例設為全域變數，方便除錯 / Set simulator instance as global variable for debugging
    window.floorMatSimulator = simulator;
    
    // 確保語言UI在DOM完全加載後正確更新 / Ensure language UI updates correctly after DOM is fully loaded
    setTimeout(() => {
        simulator.langManager.updateUI();
    }, 0);
    
    // 顯示歡迎訊息 / Show welcome message
    simulator.showMessage(simulator.langManager.getText('ready-message'), 'success');
});