import * as THREE from 'three';

/**
 * UIキャンバスコンポーネント
 * 2D描画とUIコントロールを管理するクラス
 */
export class UICanvas {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // デフォルトオプション
        this.options = {
            width: 260,
            height: 200,
            backgroundColor: '#f8f9fa',
            gridColor: '#e9ecef',
            gridSize: 20,
            ...options
        };

        // スクロール関連の状態
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.isScrolling = false;

        this.init();
        this.setupScrolling();
    }

    init() {
        // キャンバスサイズを設定
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;

        // 初期描画
        this.draw();
    }

    /**
     * スクロール機能をセットアップ
     */
    setupScrolling() {
        // マウスホイールでスクロール
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scrollSpeed = 20;

            if (e.deltaY > 0) {
                // 下スクロール
                this.scrollOffset = Math.min(this.scrollOffset + scrollSpeed, this.maxScrollOffset);
            } else {
                // 上スクロール
                this.scrollOffset = Math.max(this.scrollOffset - scrollSpeed, 0);
            }

            // 再描画
            this.redraw();
        }, { passive: false });

        // タッチでスクロール（モバイル対応）
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            this.isScrolling = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isScrolling) return;
            e.preventDefault();

            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;

            this.scrollOffset = Math.max(0, Math.min(this.scrollOffset + deltaY, this.maxScrollOffset));
            touchStartY = touchY;

            this.redraw();
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isScrolling = false;
        });
    }

    /**
     * キャンバスをクリア
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 角丸矩形を描画するヘルパーメソッド
     */
    drawRoundedRect(x, y, width, height, radius, fillStyle = null, strokeStyle = null, lineWidth = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }

        if (strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }
    }

    /**
     * 背景を描画
     */
    drawBackground() {
        // 角丸の背景を描画
        this.drawRoundedRect(0, 0, this.canvas.width, this.canvas.height, 8, this.options.backgroundColor);
    }

    /**
     * グリッドを描画
     */
    drawGrid() {
        // 角丸のクリッピングパスを設定
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(12, 0);
        this.ctx.lineTo(this.canvas.width - 8, 0);
        this.ctx.quadraticCurveTo(this.canvas.width, 0, this.canvas.width, 8);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 8);
        this.ctx.quadraticCurveTo(this.canvas.width, this.canvas.height, this.canvas.width - 8, this.canvas.height);
        this.ctx.lineTo(8, this.canvas.height);
        this.ctx.quadraticCurveTo(0, this.canvas.height, 0, this.canvas.height - 8);
        this.ctx.lineTo(0, 8);
        this.ctx.quadraticCurveTo(0, 0, 8, 0);
        this.ctx.closePath();
        this.ctx.clip();

        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 1;

        // 縦線
        for (let i = 0; i <= this.canvas.width; i += this.options.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        // 横線
        for (let i = 0; i <= this.canvas.height; i += this.options.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * タイトルテキストを描画
     */
    drawTitle(title = 'Visible Grape Positions') {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, 20);
    }

    /**
     * ブドウの座標リストを描画
     */
    drawGrapePositions(grapePositions = []) {
        if (grapePositions.length === 0) {
            // 表示されているブドウがない場合
            this.ctx.fillStyle = '#666';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No visible grapes', this.canvas.width / 2, this.canvas.height / 2);
            this.maxScrollOffset = 0;
            return;
        }

        // ブドウ座標を表示
        this.ctx.fillStyle = '#333';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'left';

        const startY = 35;
        const lineHeight = 14;
        const itemHeight = lineHeight * 2 + 2; // ブランチ情報 + 座標情報 + マージン
        const visibleAreaHeight = this.canvas.height - startY - 30; // タイトルと合計数の分を除く

        // 総コンテンツ高さを計算
        const totalContentHeight = grapePositions.length * itemHeight;
        this.maxScrollOffset = Math.max(0, totalContentHeight - visibleAreaHeight);

        // スクロール範囲を制限
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));

        // 表示開始インデックスを計算
        const startIndex = Math.floor(this.scrollOffset / itemHeight);
        const endIndex = Math.min(startIndex + Math.ceil(visibleAreaHeight / itemHeight) + 1, grapePositions.length);

        let yOffset = startY - (this.scrollOffset % itemHeight);

        // 表示するアイテムのみ描画
        for (let i = startIndex; i < endIndex; i++) {
            if (yOffset > this.canvas.height - 25) break; // 下部マージンを確保

            const grape = grapePositions[i];
            const { branchBaseIndex, pinIndex, position, size } = grape;
            const x = position.x.toFixed(2);
            const y = position.y.toFixed(2);
            const z = position.z.toFixed(2);

            // ブランチとピンの情報を1行に収める
            const branchInfo = `B${branchBaseIndex}-P${pinIndex} (${size}):`;
            const coordInfo = `(${x}, ${y}, ${z})`;

            // ブランチ情報を描画
            this.ctx.fillStyle = '#007bff';
            this.ctx.fillText(branchInfo, 10, yOffset);

            // 座標情報を描画
            this.ctx.fillStyle = '#333';
            this.ctx.fillText(coordInfo, 10, yOffset + lineHeight);

            yOffset += itemHeight;
        }

        // スクロールバーを描画
        this.drawScrollbar();

        // 合計数を見やすくするための角丸背景の描画
        this.drawRoundedRect(5, this.canvas.height - 25, this.canvas.width - 10, 20, 8, '#f8f9fa');

        // 合計数を下部に表示
        this.ctx.fillStyle = '#28a745';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Total: ${grapePositions.length} visible grapes ${grapePositions.length > (visibleAreaHeight / itemHeight) ? '(scroll to see more)' : ''}`,
            this.canvas.width / 2,
            this.canvas.height - 8
        );
    }

    /**
     * スクロールバーを描画
     */
    drawScrollbar() {
        if (this.maxScrollOffset <= 0) return;

        const scrollbarWidth = 8;
        const scrollbarX = this.canvas.width - scrollbarWidth - 5; // 角丸境界から少し内側
        const scrollbarY = 35;
        const scrollbarHeight = this.canvas.height - 35 - 30;

        // スクロールバー背景（角丸）
        this.drawRoundedRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 4, '#e0e0e0');

        // スクロールバーハンドル（角丸）
        const handleHeight = Math.max(20, scrollbarHeight * (scrollbarHeight / (scrollbarHeight + this.maxScrollOffset)));
        const handleY = scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - handleHeight);

        this.drawRoundedRect(scrollbarX, handleY, scrollbarWidth, handleHeight, 4, '#888');
    }

    /**
     * メイン描画関数
     */
    draw(grapePositions = []) {
        this.clear();
        this.drawBackground();

        // 角丸のクリッピングパスを設定
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(12, 0);
        this.ctx.lineTo(this.canvas.width - 8, 0);
        this.ctx.quadraticCurveTo(this.canvas.width, 0, this.canvas.width, 8);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 8);
        this.ctx.quadraticCurveTo(this.canvas.width, this.canvas.height, this.canvas.width - 8, this.canvas.height);
        this.ctx.lineTo(8, this.canvas.height);
        this.ctx.quadraticCurveTo(0, this.canvas.height, 0, this.canvas.height - 8);
        this.ctx.lineTo(0, 8);
        this.ctx.quadraticCurveTo(0, 0, 8, 0);
        this.ctx.closePath();
        this.ctx.clip();

        this.drawGrid();
        this.drawTitle();
        this.drawGrapePositions(grapePositions);

        this.ctx.restore();
    }

    /**
     * ブドウ座標の描画更新
     */
    updateGrapePositions(grapePositions) {
        this.currentGrapePositions = grapePositions;
        this.draw(grapePositions);
    }

    /**
     * 再描画（スクロール時）
     */
    redraw() {
        if (this.currentGrapePositions) {
            this.draw(this.currentGrapePositions);
        }
    }

    /**
     * アニメーション用の描画更新（旧updateメソッドの置き換え）
     */
    update(grapePositions) {
        this.draw(grapePositions);
    }

    /**
     * キャンバスサイズを変更
     */
    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.draw();
    }
}

/**
 * UIコントロールマネージャー
 * スライダーやボタンなどのUIコントロールを管理
 */
export class UIControlManager {
    constructor(uiCanvas) {
        this.uiCanvas = uiCanvas;
        this.controls = {};
        this.callbacks = {};
        this.init();
    }

    init() {
        // コントロール要素を取得
        this.controls = {
            baseRadius: document.getElementById('baseRadius'),
            stemRadius: document.getElementById('stemRadius'),
            stemHeight: document.getElementById('stemHeight'),
            materialColor: document.getElementById('materialColor'),
            resetCamera: document.getElementById('resetCamera'),
            // BranchBase プロパティ要素
            closeBranchProperties: document.getElementById('closeBranchProperties'),
            growBranch: document.getElementById('growBranch'),
            removeBranch: document.getElementById('removeBranch'),
            // 回転コントロール要素
            rotateLeft: document.getElementById('rotateLeft'),
            rotateRight: document.getElementById('rotateRight'),
            rotationIndicator: document.getElementById('rotationIndicator'),
            rotationValue: document.getElementById('rotationValue'),
            // ブドウ制御要素
            grapeSize0: document.getElementById('grapeSize0'),
            grapeSize1: document.getElementById('grapeSize1'),
            grapeSize2: document.getElementById('grapeSize2'),
            toggleGrape0: document.getElementById('toggleGrape0'),
            toggleGrape1: document.getElementById('toggleGrape1'),
            toggleGrape2: document.getElementById('toggleGrape2'),
            showAllGrapes: document.getElementById('showAllGrapes'),
            hideAllGrapes: document.getElementById('hideAllGrapes'),
            // CSV出力ボタン
            exportCsv: document.getElementById('exportCsv')
        };

        // 値表示要素を取得
        this.valueDisplays = {
            baseRadius: document.getElementById('baseRadiusValue'),
            stemRadius: document.getElementById('stemRadiusValue'),
            stemHeight: document.getElementById('stemHeightValue')
        };

        // BranchBase プロパティパネル要素
        this.branchPropertiesPanel = document.getElementById('branchProperties');
        this.branchPositionDisplay = document.getElementById('branchPosition');
        this.branchAxisDisplay = document.getElementById('branchAxis');
        this.grapeControlsPanel = document.getElementById('grapeControls');

        // 現在選択されているBranchBase
        this.selectedBranchBase = null;

        // 回転の状態管理
        this.currentRotation = 0; // 度数で管理

        this.setupEventListeners();
        this.updateValueDisplays();
    }

    setupEventListeners() {
        // スライダーイベント
        this.controls.baseRadius.addEventListener('input', () => {
            this.updateValueDisplays();
            this.triggerCallback('baseRadiusChange', parseFloat(this.controls.baseRadius.value));
        });

        this.controls.stemRadius.addEventListener('input', () => {
            this.updateValueDisplays();
            this.triggerCallback('stemRadiusChange', parseFloat(this.controls.stemRadius.value));
        });

        this.controls.stemHeight.addEventListener('input', () => {
            this.updateValueDisplays();
            this.triggerCallback('stemHeightChange', parseFloat(this.controls.stemHeight.value));
        });

        // カラーピッカー
        this.controls.materialColor.addEventListener('change', () => {
            this.triggerCallback('colorChange', this.controls.materialColor.value);
        });

        // リセットボタン
        this.controls.resetCamera.addEventListener('click', () => {
            this.triggerCallback('resetCamera');
        });

        this.controls.closeBranchProperties.addEventListener('click', () => {
            this.closeBranchProperties();
        });

        this.controls.growBranch.addEventListener('click', () => {
            if (this.selectedBranchBase) {
                this.triggerCallback('growBranch', this.selectedBranchBase);
            }
        });

        this.controls.removeBranch.addEventListener('click', () => {
            if (this.selectedBranchBase) {
                this.triggerCallback('removeBranch', this.selectedBranchBase);
            }
        });

        // 回転コントロールのイベントリスナー
        this.controls.rotateLeft.addEventListener('click', () => {
            this.rotateBranch(-60);
        });

        this.controls.rotateRight.addEventListener('click', () => {
            this.rotateBranch(60);
        });

        // ブドウ制御のイベントリスナー
        this.controls.grapeSize0.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize0.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 0,
                    size: newSize
                });
            }
        });

        this.controls.grapeSize1.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize1.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 1,
                    size: newSize
                });
            }
        });

        this.controls.grapeSize2.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize2.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 2,
                    size: newSize
                });
            }
        });

        this.controls.toggleGrape0.addEventListener('click', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                this.triggerCallback('toggleGrape', { branchBase: this.selectedBranchBase, pinIndex: 0 });
                this.updateGrapeButtonState(0);
            }
        });

        this.controls.toggleGrape1.addEventListener('click', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                this.triggerCallback('toggleGrape', { branchBase: this.selectedBranchBase, pinIndex: 1 });
                this.updateGrapeButtonState(1);
            }
        });

        this.controls.toggleGrape2.addEventListener('click', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                this.triggerCallback('toggleGrape', { branchBase: this.selectedBranchBase, pinIndex: 2 });
                this.updateGrapeButtonState(2);
            }
        });

        this.controls.showAllGrapes.addEventListener('click', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                this.triggerCallback('showAllGrapes', this.selectedBranchBase);
                this.updateAllGrapeButtonStates();
            }
        });

        this.controls.hideAllGrapes.addEventListener('click', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                this.triggerCallback('hideAllGrapes', this.selectedBranchBase);
                this.updateAllGrapeButtonStates();
            }
        });

        // ピンごとのブドウサイズ変更イベントリスナー
        this.controls.grapeSize0.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize0.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 0,
                    size: newSize
                });
            }
        });

        this.controls.grapeSize1.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize1.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 1,
                    size: newSize
                });
            }
        });

        this.controls.grapeSize2.addEventListener('change', () => {
            if (this.selectedBranchBase && this.selectedBranchBase.branch) {
                const newSize = parseFloat(this.controls.grapeSize2.value);
                this.triggerCallback('grapeIndividualSizeChange', {
                    branchBase: this.selectedBranchBase,
                    pinIndex: 2,
                    size: newSize
                });
            }
        });

        // CSV出力ボタンのイベントリスナー
        this.controls.exportCsv.addEventListener('click', () => {
            this.triggerCallback('exportCsv');
        });
    }

    updateValueDisplays() {
        this.valueDisplays.baseRadius.textContent = this.controls.baseRadius.value;
        this.valueDisplays.stemRadius.textContent = this.controls.stemRadius.value;
        this.valueDisplays.stemHeight.textContent = this.controls.stemHeight.value;
    }

    /**
     * ブランチを回転させる
     */
    rotateBranch(deltaAngle) {
        if (!this.selectedBranchBase) return;

        this.currentRotation = (this.currentRotation + deltaAngle) % 360;
        if (this.currentRotation < 0) this.currentRotation += 360;

        // UIの回転インジケーターを更新
        this.updateRotationDisplay();

        // 回転をコールバックで通知
        this.triggerCallback('branchRotation', {
            branchBase: this.selectedBranchBase,
            rotation: this.currentRotation
        });
    }

    /**
     * 回転表示を更新
     */
    updateRotationDisplay() {
        if (this.controls.rotationIndicator && this.controls.rotationValue) {
            this.controls.rotationIndicator.style.transform =
                `translateX(-50%) rotate(${this.currentRotation}deg)`;
            this.controls.rotationValue.textContent = `${this.currentRotation}°`;
        }
    }
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * コールバック関数を実行
     */
    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    /**
     * コントロールの値を取得
     */
    getValues() {
        return {
            baseRadius: parseFloat(this.controls.baseRadius.value),
            stemRadius: parseFloat(this.controls.stemRadius.value),
            stemHeight: parseFloat(this.controls.stemHeight.value),
            materialColor: this.controls.materialColor.value
        };
    }

    /**
     * コントロールの値を設定
     */
    setValues(values) {
        if (values.baseRadius !== undefined) {
            this.controls.baseRadius.value = values.baseRadius;
        }
        if (values.stemRadius !== undefined) {
            this.controls.stemRadius.value = values.stemRadius;
        }
        if (values.stemHeight !== undefined) {
            this.controls.stemHeight.value = values.stemHeight;
        }
        if (values.materialColor !== undefined) {
            this.controls.materialColor.value = values.materialColor;
        }

        this.updateValueDisplays();
    }

    /**
     * BranchBaseプロパティパネルを表示
     */
    showBranchProperties(branchBase) {
        this.selectedBranchBase = branchBase;

        // 位置と軸の情報を表示
        const position = branchBase.point;
        const axis = branchBase.axes;

        this.branchPositionDisplay.textContent =
            `x: ${position.x.toFixed(3)}, y: ${position.y.toFixed(3)}, z: ${position.z.toFixed(3)}`;
        this.branchAxisDisplay.textContent =
            `x: ${axis.x.toFixed(3)}, y: ${axis.y.toFixed(3)}, z: ${axis.z.toFixed(3)}`;

        // 回転状態を初期化（BranchBaseに保存された回転があればそれを使用、なければ0）
        this.currentRotation = branchBase.rotation || 0;
        this.updateRotationDisplay();

        // ブランチの状態に応じてボタンの表示を切り替え
        if (branchBase.hasBranch) {
            this.controls.growBranch.style.display = 'none';
            this.controls.removeBranch.style.display = 'inline-block';
            this.grapeControlsPanel.style.display = 'block'; // ブドウ制御パネルを表示

            // ブドウボタンの初期状態を設定
            this.updateAllGrapeButtonStates();
        } else {
            this.controls.growBranch.style.display = 'inline-block';
            this.controls.removeBranch.style.display = 'none';
            this.grapeControlsPanel.style.display = 'none'; // ブドウ制御パネルを非表示
        }

        // パネルを表示
        this.branchPropertiesPanel.style.display = 'block';
    }

    /**
     * BranchBaseプロパティパネルを非表示
     */
    closeBranchProperties() {
        this.selectedBranchBase = null;
        this.branchPropertiesPanel.style.display = 'none';
        this.grapeControlsPanel.style.display = 'none';
        this.triggerCallback('branchPropertiesClosed');
    }

    /**
     * 選択されているBranchBaseを取得
     */
    getSelectedBranchBase() {
        return this.selectedBranchBase;
    }

    /**
     * ブドウボタンの状態を更新
     */
    updateGrapeButtonState(pinIndex) {
        if (this.selectedBranchBase && this.selectedBranchBase.branch) {
            const isActive = this.selectedBranchBase.branch.hasGrapes[pinIndex];
            const button = this.controls[`toggleGrape${pinIndex}`];

            if (isActive) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        }
    }

    /**
     * 全てのブドウボタンの状態を更新
     */
    updateAllGrapeButtonStates() {
        for (let i = 0; i < 3; i++) {
            this.updateGrapeButtonState(i);
        }
    }

    /**
     * ブドウ座標をCSV形式で出力
     */
    exportGrapePositionsToCSV(grapePositions) {
        if (!grapePositions || grapePositions.length === 0) {
            alert('No visible grapes to export.');
            return;
        }

        // CSVヘッダー
        const headers = ['BranchBaseIndex', 'PinIndex', 'Size', 'X', 'Y', 'Z'];
        
        // CSVデータ行を作成
        const csvRows = [headers.join(',')];
        
        grapePositions.forEach(grape => {
            const row = [
                grape.branchBaseIndex,
                grape.pinIndex,
                grape.size,
                grape.position.x.toFixed(6),
                grape.position.y.toFixed(6),
                grape.position.z.toFixed(6)
            ];
            csvRows.push(row.join(','));
        });

        // CSV文字列を作成
        const csvContent = csvRows.join('\n');
        
        // BOMを追加してUTF-8として保存（Excel対応）
        const bom = '\uFEFF';
        const csvWithBom = bom + csvContent;
        
        // Blobオブジェクトを作成
        const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
        
        // ダウンロードリンクを作成
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // ファイル名に現在の日時を含める
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.setAttribute('download', `grape_positions_${timestamp}.csv`);
        
        // リンクをクリックしてダウンロード
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URLオブジェクトを解放
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${grapePositions.length} grape positions to CSV`);
    }
}
