import * as THREE from 'three';
import { BranchHitTester } from './BranchHitTester.js';

/**
 * BranchBaseのクリック制御クラス
 * BranchBaseをクリックするとカメラが正面から映すように移動する
 */
export class ClickBranchBaseControls {
    constructor(camera, controls, renderer, scene, branchBases, uiControlManager = null) {
        this.camera = camera;
        this.controls = controls;
        this.renderer = renderer;
        this.scene = scene;
        this.branchBases = branchBases;
        this.uiControlManager = uiControlManager;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hitTester = new BranchHitTester(branchBases);

        this.isAnimating = false;
        this.animationDuration = 1000; // アニメーション時間（ミリ秒）

        this.setupEventListeners();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // メソッドをバインドして保存
        this.onMouseClickBound = this.onMouseClick.bind(this);
        this.onMouseMoveBound = this.onMouseMove.bind(this);

        this.renderer.domElement.addEventListener('click', this.onMouseClickBound);

        // マウスオーバー時のカーソル変更
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveBound);
    }

    /**
     * マウスクリックイベント処理
     */
    onMouseClick(event) {
        if (this.isAnimating) return;

        console.log('Click detected, branchBases count:', this.branchBases.length);

        // マウス座標を正規化座標系に変換
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        console.log('Mouse coordinates:', this.mouse.x, this.mouse.y);

        // レイキャスティング
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const allObjects = this.hitTester.getClickableObjects();
        const intersects = this.raycaster.intersectObjects(allObjects);
        console.log('Intersects count:', intersects.length);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log('Clicked object:', clickedObject);

            const clickedBranchBase = this.hitTester.findBranchBaseForObject(clickedObject);
            console.log('Found branch base:', clickedBranchBase);

            if (clickedBranchBase) {
                console.log('Focusing on branch base at position:', clickedBranchBase.point);
                this.focusBranchBase(clickedBranchBase);
            }
        }
    }

    /**
     * マウス移動イベント処理（カーソル変更用）
     */
    onMouseMove(event) {
        if (this.isAnimating) return;

        // マウス座標を正規化座標系に変換
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // レイキャスティング
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const allObjects = this.hitTester.getClickableObjects();
        const intersects = this.raycaster.intersectObjects(allObjects);

        // カーソルを変更
        if (intersects.length > 0) {
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * 指定されたBranchBaseにカメラをフォーカス
     */
    focusBranchBase(branchBase) {
        if (this.isAnimating) return;

        console.log('focusBranchBase called with:', branchBase);

        // UIプロパティパネルを表示
        if (this.uiControlManager) {
            this.uiControlManager.showBranchProperties(branchBase);
        }

        // フォーカス対象の位置と軸を決定
        let targetPosition, branchAxis;

        if (branchBase.hasBranch && branchBase.branch) {
            // ブランチが生えている場合は、ブランチの先端にフォーカス
            targetPosition = branchBase.branch.point.clone();
            // ブランチの高さを考慮して先端位置を計算
            targetPosition.add(branchBase.branch.axes.clone().multiplyScalar(branchBase.branch.height / 2));
            branchAxis = branchBase.branch.axes.clone().normalize();
            console.log('Focusing on branch tip');
        } else {
            // BranchBaseのみの場合は、BranchBaseの位置
            targetPosition = branchBase.point.clone();
            branchAxis = branchBase.axes.clone().normalize();
            console.log('Focusing on branch base');
        }

        console.log('Target position:', targetPosition);
        console.log('Branch axis:', branchAxis);

        // カメラの目標位置を計算（対象から離れた正面位置）
        const distance = 5; // カメラと対象の距離を5に増加
        const cameraTargetPosition = targetPosition.clone().add(branchAxis.multiplyScalar(distance));

        console.log('Camera target position:', cameraTargetPosition);
        console.log('Starting camera animation...');

        // カメラのアニメーション開始
        this.animateCamera(cameraTargetPosition, targetPosition);
    }

    /**
     * カメラアニメーション
     */
    animateCamera(targetCameraPosition, targetLookAt) {
        this.isAnimating = true;

        console.log('animateCamera started');
        console.log('From position:', this.camera.position.clone());
        console.log('To position:', targetCameraPosition);
        console.log('Look at target:', targetLookAt);

        // 開始位置と回転
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        // アニメーション用変数
        let startTime = null;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);

            // イージング関数（スムーズな動き）
            const easeProgress = this.easeInOutCubic(progress);

            // カメラ位置の補間
            this.camera.position.lerpVectors(startPosition, targetCameraPosition, easeProgress);

            // ターゲット位置の補間
            this.controls.target.lerpVectors(startTarget, targetLookAt, easeProgress);

            // コントロールを更新
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                console.log('Animation completed');
                this.isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * イージング関数（スムーズなアニメーション用）
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * BranchBases配列を更新
     */
    updateBranchBases(newBranchBases) {
        this.branchBases = newBranchBases;
        this.hitTester.updateBranchBases(newBranchBases);
    }

    /**
     * UIControlManagerを設定
     */
    setUIControlManager(uiControlManager) {
        this.uiControlManager = uiControlManager;
    }

    /**
     * 強調表示用の機能（オプション）
     */
    highlightBranchBase(branchBase, highlight = true) {
        branchBase.setSelected(highlight);
    }

    /**
     * イベントリスナーを削除（クリーンアップ用）
     */
    dispose() {
        this.renderer.domElement.removeEventListener('click', this.onMouseClickBound);
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveBound);
    }
}
