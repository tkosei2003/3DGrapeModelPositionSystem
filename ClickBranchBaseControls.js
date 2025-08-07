import * as THREE from 'three';

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
        this.raycaster.setFromCamera(this.mouse, this.camera);        // BranchBaseのメッシュを取得
        const branchMeshes = this.branchBases.map(branchBase => branchBase.mesh);
        console.log('Branch meshes count:', branchMeshes.length);

        // 生えているブランチのメッシュも取得
        const allBranchMeshes = [];
        this.branchBases.forEach(branchBase => {
            if (branchBase.hasBranch && branchBase.branch) {
                allBranchMeshes.push(branchBase.branch.mesh);
            }
        });

        // すべての子オブジェクトも含めてレイキャスティング（再帰的に取得）
        const allObjects = [];

        // BranchBaseのメッシュとその子オブジェクト
        branchMeshes.forEach(mesh => {
            allObjects.push(mesh);
            this.addChildrenRecursively(mesh, allObjects);
        });

        // ブランチのメッシュとその子オブジェクト
        allBranchMeshes.forEach(mesh => {
            allObjects.push(mesh);
            this.addChildrenRecursively(mesh, allObjects);
        });

        const intersects = this.raycaster.intersectObjects(allObjects);
        console.log('Intersects count:', intersects.length);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log('Clicked object:', clickedObject);

            // クリックされたオブジェクトまたはその親がBranchBaseのメッシュかどうかを判定
            let targetMesh = null;
            let clickedBranchBase = null;

            // まずBranchBaseをチェック
            if (branchMeshes.includes(clickedObject)) {
                targetMesh = clickedObject;
                clickedBranchBase = this.branchBases.find(branchBase => branchBase.mesh === targetMesh);
            } else if (clickedObject.parent && branchMeshes.includes(clickedObject.parent)) {
                targetMesh = clickedObject.parent;
                clickedBranchBase = this.branchBases.find(branchBase => branchBase.mesh === targetMesh);
            }
            // 次にブランチをチェック
            else if (allBranchMeshes.includes(clickedObject)) {
                targetMesh = clickedObject;
                clickedBranchBase = this.branchBases.find(branchBase => branchBase.branch && branchBase.branch.mesh === targetMesh);
            } else if (clickedObject.parent && allBranchMeshes.includes(clickedObject.parent)) {
                targetMesh = clickedObject.parent;
                clickedBranchBase = this.branchBases.find(branchBase => branchBase.branch && branchBase.branch.mesh === targetMesh);
            }
            // ブランチの子要素（ジャンクションオブジェクトなど）がクリックされた場合
            else {
                // 親を辿ってブランチメッシュを探す
                let currentObject = clickedObject;
                while (currentObject.parent) {
                    currentObject = currentObject.parent;
                    if (allBranchMeshes.includes(currentObject)) {
                        targetMesh = currentObject;
                        clickedBranchBase = this.branchBases.find(branchBase => branchBase.branch && branchBase.branch.mesh === targetMesh);
                        break;
                    }
                    if (branchMeshes.includes(currentObject)) {
                        targetMesh = currentObject;
                        clickedBranchBase = this.branchBases.find(branchBase => branchBase.mesh === targetMesh);
                        break;
                    }
                }
            }

            console.log('Target mesh:', targetMesh);
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

        // BranchBaseのメッシュを取得
        const branchMeshes = this.branchBases.map(branchBase => branchBase.mesh);

        // 生えているブランチのメッシュも取得
        const allBranchMeshes = [];
        this.branchBases.forEach(branchBase => {
            if (branchBase.hasBranch && branchBase.branch) {
                allBranchMeshes.push(branchBase.branch.mesh);
            }
        });

        // すべての子オブジェクトも含めてレイキャスティング（再帰的に取得）
        const allObjects = [];

        // BranchBaseのメッシュとその子オブジェクト
        branchMeshes.forEach(mesh => {
            allObjects.push(mesh);
            this.addChildrenRecursively(mesh, allObjects);
        });

        // ブランチのメッシュとその子オブジェクト
        allBranchMeshes.forEach(mesh => {
            allObjects.push(mesh);
            this.addChildrenRecursively(mesh, allObjects);
        });

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
    }

    /**
     * UIControlManagerを設定
     */
    setUIControlManager(uiControlManager) {
        this.uiControlManager = uiControlManager;
    }

    /**
     * 再帰的に子オブジェクトを配列に追加
     */
    addChildrenRecursively(object, array) {
        object.children.forEach(child => {
            array.push(child);
            this.addChildrenRecursively(child, array);
        });
    }

    /**
     * 強調表示用の機能（オプション）
     */
    highlightBranchBase(branchBase, highlight = true) {
        if (highlight) {
            // BranchBaseを強調表示
            branchBase.mesh.material.emissive.setHex(0x444444);
        } else {
            // 強調表示を解除
            branchBase.mesh.material.emissive.setHex(0x000000);
        }
    }

    /**
     * イベントリスナーを削除（クリーンアップ用）
     */
    dispose() {
        this.renderer.domElement.removeEventListener('click', this.onMouseClickBound);
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveBound);
    }
}