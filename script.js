// 地墊模擬器 - 主要JavaScript功能

class FloorMatSimulator {
    constructor() {
        // DOM元素
        this.gridArea = document.getElementById('grid-area');
        
        // 縮放相關設定
        this.zoomLevel = 1;
        this.ZOOM_SETTINGS = {
            MIN: 0.5,
            MAX: 3,
            STEP: 0.1
        };
        
        // 網格設定
        this.gridCols = 8;
        this.gridRows = 8;
        this.placedMats = 0;
        
        // 群組資訊
        this.groups = [];
        this.isDraggingExistingMat = false;
        
        // 動畫常數
        this.ANIMATION_COLORS = {
            HIGHLIGHT: '#2471ed',
            DEFAULT: '#ffffff'
        };
        
        this.ANIMATION_TIMING = {
            FADE_IN: 1000,  // 漸入時間 (ms)
            FADE_OUT: 3000, // 漸出時間 (ms)
            MESSAGE_AUTO_HIDE: 3000, // 訊息自動隱藏時間 (ms)
            SLIDE_ANIMATION: 300, // 訊息滑動動畫時間 (ms)
            DOUBLE_CLICK_DELAY: 300 // 雙擊檢測延遲 (ms)
        };
        
        // 訊息顏色設定
        this.MESSAGE_COLORS = {
            SUCCESS: '#27ae60',
            WARNING: '#f39c12',
            ERROR: '#e74c3c',
            INFO: '#3498db'
        };
        
        // 訊息樣式設定
        this.MESSAGE_STYLES = {
            POSITION_TOP: '20px',
            POSITION_RIGHT: '20px',
            PADDING: '12px 20px',
            BORDER_RADIUS: '4px',
            Z_INDEX: '10000',
            BOX_SHADOW: '0 4px 8px rgba(0,0,0,0.2)'
        };
        
        // 色彩映射設定
        this.COLOR_MAP = {
            SATURATION: 70,
            LIGHTNESS: 50,
            HUE_RANGE: 300,
            SINGLE_GROUP_HUE_STEP: 60
        };
        
        // UI顏色設定
        this.UI_COLORS = {
            LOG_TIME: '#2c3e50'
        };
        
        // 佈局常數
        this.LAYOUT = {
            LOG_MARGIN_TOP: '2px'
        };
        
        this.init();
    }
    
    // Rainbow colormap函數 - 根據群組索引產生彩虹色
    getRainbowColor(groupIndex, totalGroups) {
        // 將群組索引映射到0-1之間，即使只有一個群組也使用colormap
        const hue = totalGroups <= 1 ? 
            (groupIndex * this.COLOR_MAP.SINGLE_GROUP_HUE_STEP) % 360 : 
            (groupIndex / Math.max(1, totalGroups - 1)) * this.COLOR_MAP.HUE_RANGE;
        
        return `hsl(${hue}, ${this.COLOR_MAP.SATURATION}%, ${this.COLOR_MAP.LIGHTNESS}%)`;
    }
    
    init() {
        this.createGrid();
        this.bindEvents();
        this.updateUI();
    }
    
    // 創建網格
    createGrid() {
        this.gridArea.innerHTML = '';
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加拖放事件監聽器
                cell.addEventListener('dragover', this.handleDragOver.bind(this));
                cell.addEventListener('drop', this.handleDrop.bind(this));
                cell.addEventListener('dragleave', this.handleDragLeave.bind(this));
                
                this.gridArea.appendChild(cell);
            }
        }
    }
    
    // 綁定事件
    bindEvents() {
        // 縮放按鈕
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-zoom').addEventListener('click', () => this.resetZoom());
        
        // 地墊拖曳
        document.querySelector('.mat-item').addEventListener('dragstart', this.handleDragStart.bind(this));
        document.querySelector('.mat-item').addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // 清除記錄按鈕
        document.getElementById('clear-log').addEventListener('click', this.clearOutputLog.bind(this));
        
        // 右鍵菜單（移除地墊）
        this.gridArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.grid-cell');
            if (cell && cell.classList.contains('occupied')) {
                this.removeMat(cell, true); // 右鍵刪除需要確認
            }
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 滑鼠滾輪縮放
        this.gridArea.addEventListener('wheel', this.handleWheel.bind(this));
        
        // 網格拖曳（當縮放時）
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
    
    // 拖曳開始
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.mat);
        e.target.classList.add('dragging');
        this.isDraggingExistingMat = false;
    }
    
    // 地墊拖曳開始
    handleMatDragStart(e, sourceCell) {
        e.dataTransfer.setData('text/plain', 'existing_mat');
        e.dataTransfer.setData('source-row', sourceCell.dataset.row);
        e.dataTransfer.setData('source-col', sourceCell.dataset.col);
        e.target.classList.add('dragging');
        sourceCell.classList.add('dragging-source');
        this.isDraggingExistingMat = true;
        this.showMessage('拖曳地墊到新位置', 'info');
    }
    
    // 地墊拖曳結束
    handleMatDragEnd(e, sourceCell) {
        e.target.classList.remove('dragging');
        sourceCell.classList.remove('dragging-source');
        this.isDraggingExistingMat = false;
        
        // 移除所有拖曳相關的樣式
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('drag-over', 'dragging-source');
        });
    }
    
    // 拖曳結束
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    // 拖曳懸停
    handleDragOver(e) {
        e.preventDefault();
        const cell = e.currentTarget;
        
        // 如果格子已被占用，不顯示拖曳效果
        if (!cell.classList.contains('occupied')) {
            cell.classList.add('drag-over');
        }
    }
    
    // 拖曳離開
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    // 放置
    handleDrop(e) {
        e.preventDefault();
        const cell = e.currentTarget;
        const matType = e.dataTransfer.getData('text/plain');
        
        cell.classList.remove('drag-over');
        
        if (matType === 'existing_mat') {
            // 移動現有地墊
            const sourceRow = e.dataTransfer.getData('source-row');
            const sourceCol = e.dataTransfer.getData('source-col');
            const sourceCell = document.querySelector(`[data-row="${sourceRow}"][data-col="${sourceCol}"]`);
            
            if (sourceCell && sourceCell !== cell) {
                this.moveMatTo(sourceCell, cell);
            }
        } else {
            // 檢查格子是否已被占用
            if (cell.classList.contains('occupied')) {
                this.showMessage('此位置已有地墊！', 'warning');
                return;
            }
            
            // 放置新地墊
            this.placeMat(cell, matType);
        }
    }
    
    // 放置地墊
    placeMat(cell, matType) {
        cell.classList.add('occupied');
        cell.innerHTML = `<div class="mat-placed" draggable="true">
            <span class="mat-number">0</span>
        </div>`;
        
        // 添加雙擊事件
        const matElement = cell.querySelector('.mat-placed');
        let clickCount = 0;
        let clickTimer = null;
        
        matElement.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
            
            if (clickCount === 1) {
                // 單擊處理
                clickTimer = setTimeout(() => {
                    this.onMatClick(cell);
                    clickCount = 0;
                }, this.ANIMATION_TIMING.DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                // 雙擊處理
                clearTimeout(clickTimer);
                this.removeMat(cell);
                clickCount = 0;
            }
        });
        
        // 添加拖曳事件
        matElement.addEventListener('dragstart', (e) => {
            this.handleMatDragStart(e, cell);
        });
        
        matElement.addEventListener('dragend', (e) => {
            this.handleMatDragEnd(e, cell);
        });
        
        this.placedMats++;
        this.updateGroups();
        this.updateMatNumbers(); // 重新計算所有地墊編號
        this.updateUI();
        this.showMessage('地墊已放置！雙擊可刪除', 'success');
    }
    
    // 移動地墊到新位置
    moveMatTo(sourceCell, targetCell) {
        if (targetCell.classList.contains('occupied')) {
            this.showMessage('目標位置已有地墊！', 'warning');
            return;
        }
        
        // 移除源位置的地墊
        const matElement = sourceCell.querySelector('.mat-placed');
        
        // 清除源位置的高亮計時器
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
        
        // 在目標位置放置地墊
        targetCell.classList.add('occupied');
        targetCell.innerHTML = `<div class="mat-placed" draggable="true">
            <span class="mat-number">0</span>
        </div>`;
        
        // 為新位置的地墊添加事件
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
        
        // 重新計算群組和編號
        this.updateGroups();
        this.updateMatNumbers();
        this.updateUI();
        this.showMessage('地墊已移動！', 'success');
    }
    
    // 地墊點擊事件
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
        
        // 高亮顯示單個地墊
        this.highlightSingleMat(cell);
    }
    
    // 更新所有地墊編號（群組內從1開始）
    updateMatNumbers() {
        // 首先清除所有群組樣式
        const allCells = document.querySelectorAll('.grid-cell');
        allCells.forEach(cell => {
            cell.classList.remove('in-group', 'group-border-top', 'group-border-bottom', 
                                'group-border-left', 'group-border-right');
            const existingLabel = cell.querySelector('.group-label');
            if (existingLabel) {
                existingLabel.remove();
            }
            // 清除自定義樣式
            cell.style.removeProperty('--group-color');
        });

        // 計算多群組的總數（用於rainbow colormap）
        const multiGroups = this.groups.filter(group => group.size > 1);
        const totalMultiGroups = multiGroups.length;

        this.groups.forEach((group, groupIndex) => {
            if (group.size > 1) { // 只有多於一個地墊的群組才顯示群組效果
                // 獲取群組在多群組中的索引
                const multiGroupIndex = multiGroups.findIndex(g => g === group);
                const groupColor = this.getRainbowColor(multiGroupIndex, totalMultiGroups);
                
                // 創建群組位置的查找表
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
    
    // 高亮單個地墊
    highlightSingleMat(cell) {
        // 清除任何現有的計時器
        if (cell.highlightTimer) {
            clearTimeout(cell.highlightTimer);
            cell.highlightTimer = null;
        }
        if (cell.fadeTimer) {
            clearTimeout(cell.fadeTimer);
            cell.fadeTimer = null;
        }
        
        // 完全清除所有樣式和類別
        cell.classList.remove('highlighted', 'fading');
        cell.style.cssText = '';
        
        // 強制重繪
        cell.offsetHeight;
        
        // 第一階段：1秒從白色漸變到藍色
        cell.style.backgroundColor = this.ANIMATION_COLORS.DEFAULT;
        cell.style.transition = `background-color ${this.ANIMATION_TIMING.FADE_IN}ms ease-in-out`;
        cell.style.setProperty('transition', `background-color ${this.ANIMATION_TIMING.FADE_IN}ms ease-in-out`, 'important');
        
        // 強制重繪
        cell.offsetHeight;
        
        // 用requestAnimationFrame確保在下一個渲染週期改變顏色
        requestAnimationFrame(() => {
            cell.style.backgroundColor = this.ANIMATION_COLORS.HIGHLIGHT;
            cell.style.setProperty('background-color', this.ANIMATION_COLORS.HIGHLIGHT, 'important');
        });
        
        // 1秒後開始淡出動畫
        cell.fadeTimer = setTimeout(() => {
            // 第二階段：3秒從藍色漸變回白色
            cell.style.transition = `background-color ${this.ANIMATION_TIMING.FADE_OUT}ms ease-in-out`;
            cell.style.setProperty('transition', `background-color ${this.ANIMATION_TIMING.FADE_OUT}ms ease-in-out`, 'important');
            cell.style.backgroundColor = this.ANIMATION_COLORS.DEFAULT;
            cell.style.setProperty('background-color', this.ANIMATION_COLORS.DEFAULT, 'important');
            
            // 3秒後完全清除
            cell.highlightTimer = setTimeout(() => {
                cell.style.cssText = '';
                cell.classList.remove('highlighted', 'fading');
                cell.highlightTimer = null;
            }, this.ANIMATION_TIMING.FADE_OUT);
            
            cell.fadeTimer = null;
        }, this.ANIMATION_TIMING.FADE_IN);
    }
    
    // 高亮群組（保留函數以備未來使用）
    highlightGroup(groupId) {
        // 高亮當前群組
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
            <div style="margin-top: ${this.LAYOUT.LOG_MARGIN_TOP};">群組: ${groupId} | 編號: ${matNumber}</div>
        `;
        outputLog.appendChild(record);
        
        // 滾動到最新記錄
        outputLog.scrollTop = outputLog.scrollHeight;
        
        // 啟用清除按鈕
        document.getElementById('clear-log').disabled = false;
    }
    
    // 縮放功能
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
        // 重置滾動位置
        this.gridArea.parentElement.scrollLeft = 0;
        this.gridArea.parentElement.scrollTop = 0;
    }
    
    applyZoom() {
        this.gridArea.style.transform = `scale(${this.zoomLevel})`;
        this.updateUI();
    }
    
    // 滑鼠滾輪縮放
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
    
    // 鍵盤快捷鍵
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
        
        // 清除所有地墊（Delete鍵）
        if (e.key === 'Delete' && e.shiftKey) {
            this.clearAllMats();
        }
    }
    
    // 移除地墊（雙擊或右鍵點擊）
    removeMat(cell, showConfirm = false) {
        if (!showConfirm || confirm('確定要移除這個地墊嗎？')) {
            // 清除該地墊的高亮計時器
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
            this.updateMatNumbers(); // 重新計算編號
            this.updateUI();
            this.showMessage('地墊已移除！', 'info');
        }
    }
    
    // 清除所有地墊
    clearAllMats() {
        if (this.placedMats > 0 && confirm('確定要清除所有地墊嗎？')) {
            const occupiedCells = document.querySelectorAll('.grid-cell.occupied');
            occupiedCells.forEach(cell => {
                // 清除每個地墊的高亮計時器
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
            this.showMessage('所有地墊已清除！', 'info');
        }
    }
    
    // 清除輸出記錄
    clearOutputLog() {
        const outputLog = document.getElementById('output-log');
        outputLog.innerHTML = '<p class="no-records">尚無點選記錄</p>';
        document.getElementById('clear-log').disabled = true;
        this.showMessage('記錄已清除！', 'info');
    }
    
    // 更新UI
    updateUI() {
        // 更新縮放顯示
        document.querySelector('.zoom-level').textContent = `縮放: ${Math.round(this.zoomLevel * 100)}%`;
        
        // 更新網格資訊
        document.getElementById('grid-size').textContent = `${this.gridCols}x${this.gridRows}`;
        document.getElementById('placed-count').textContent = this.placedMats;
        document.getElementById('group-count').textContent = this.groups.length;
        
        // 更新按鈕狀態
        document.getElementById('zoom-in').disabled = this.zoomLevel >= this.ZOOM_SETTINGS.MAX;
        document.getElementById('zoom-out').disabled = this.zoomLevel <= this.ZOOM_SETTINGS.MIN;
    }
    
    // 顯示訊息
    showMessage(message, type = 'info') {
        // 創建訊息元素
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
        
        // 3秒後自動移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, this.ANIMATION_TIMING.SLIDE_ANIMATION);
        }, this.ANIMATION_TIMING.MESSAGE_AUTO_HIDE);
    }
    
    // 獲取訊息顏色
    getMessageColor(type) {
        switch (type) {
            case 'success': return this.MESSAGE_COLORS.SUCCESS;
            case 'warning': return this.MESSAGE_COLORS.WARNING;
            case 'error': return this.MESSAGE_COLORS.ERROR;
            default: return this.MESSAGE_COLORS.INFO;
        }
    }
    
    // 匯出網格配置
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
    
    // 匯入網格配置
    importConfiguration(configuration) {
        // 清除現有地墊
        this.clearAllMats();
        
        // 放置地墊
        configuration.mats.forEach(mat => {
            const cell = document.querySelector(`[data-row="${mat.row}"][data-col="${mat.col}"]`);
            if (cell) {
                this.placeMat(cell, mat.type);
            }
        });
        
        this.showMessage('配置已匯入！', 'success');
    }
}

// 動畫樣式
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

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new FloorMatSimulator();
    
    // 將模擬器實例設為全域變數，方便除錯
    window.floorMatSimulator = simulator;
    
    // 顯示歡迎訊息
    simulator.showMessage('地墊模擬器已準備就緒！', 'success');
});