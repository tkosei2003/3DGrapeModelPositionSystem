import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';
import { createHexagonalPrism, createHexagonalPrismSimple, createAxisHelper, createSimpleAxisHelper } from './hex.js';
import { UICanvas, UIControlManager } from './uiCanvas.js';
import { BranchGenerator } from './BranchGenerator.js';
import { ClickBranchBaseControls } from './ClickBranchBaseControls.js';
import { Branch } from './ObjectClass.js';
//import { createJunctionObject } from './JunctionObject.js';
//window.addEventListener('load', init);
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.updateMatrixWorld();


// const geometry = new THREE.BoxGeometry(1, 1, 1);
// geometry.computeVertexNormals();
const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.8,
    color: 0xdddddd,
});
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const baseCenter = new THREE.Vector3(0, 0, 0);
const stemCenter = new THREE.Vector3(0, 1, 0);
// 六角柱を作成（外接円半径6、高さ1）
let base = createHexagonalPrismSimple(baseCenter, 6, 1, material);
let stem = createHexagonalPrismSimple(stemCenter, 0.7, 19, material);
scene.add(base);
scene.add(stem);
const branchBases = [];
const branchGenerator = new BranchGenerator();
branchGenerator.generateBranchBases().forEach(branchBase => {
    scene.add(branchBase.mesh);
    branchBases.push(branchBase);
});
// グローバルアクセス用
window.base = base;
window.stem = stem;


// ClickBranchBaseControlsを宣言（グローバルスコープ）
let clickBranchBaseControls;

// XYZ軸を追加（ラベル付きで最上位に描画）
const axisHelper = createAxisHelper(10, 3);
scene.add(axisHelper);

const sizes = {
    width: window.innerWidth - 300, // UI分を差し引く
    height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.lookAt(0, 20, 0);
camera.position.x = 20;
camera.position.y = 20;
camera.position.z = 20;
scene.add(camera);

const controller = new OrbitControls(camera, canvas);

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(400, 400, 400);
scene.add(light);
var light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set(-100, -100, 0);
scene.add(light2);


const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
// 深度テストを有効にしてrenderOrderを正しく機能させる
renderer.sortObjects = true;

// ClickBranchBaseControlsを初期化（branchBasesが準備された後）
clickBranchBaseControls = new ClickBranchBaseControls(camera, controller, renderer, scene, branchBases);

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    // サイズを更新
    sizes.width = window.innerWidth - 300;
    sizes.height = window.innerHeight;

    // カメラを更新
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // レンダラーを更新
    renderer.setSize(sizes.width, sizes.height);
});

// UIコンポーネントの初期化
const uiCanvas = new UICanvas('uiCanvas', {
    width: 260,
    height: 300
});

const uiControlManager = new UIControlManager(uiCanvas);

// ブドウ座標表示の最適化用変数
let lastGrapePositionsHash = '';

// ClickBranchBaseControlsにUIControlManagerを設定
clickBranchBaseControls.setUIControlManager(uiControlManager);

// 初期のブドウ座標表示を更新
updateGrapePositionsDisplay();

// UIコントロールのイベントハンドラーを設定
uiControlManager.on('baseRadiusChange', (value) => {
    // 既存のbaseオブジェクトを削除
    scene.remove(base);

    // 新しいbaseオブジェクトを作成
    base = createHexagonalPrismSimple(baseCenter, value, 1, material);
    scene.add(base);
});

uiControlManager.on('stemRadiusChange', (value) => {
    // 既存のstemオブジェクトを削除
    scene.remove(stem);

    // 現在のstemHeightを取得
    const currentStemHeight = parseFloat(document.getElementById('stemHeight').value);

    // 新しいstemオブジェクトを作成
    stem = createHexagonalPrismSimple(stemCenter, value, currentStemHeight, material);
    scene.add(stem);

    // branch Basesも更新
    updateBranchBases(value, currentStemHeight);
});

uiControlManager.on('stemHeightChange', (value) => {
    // 既存のstemオブジェクトを削除
    scene.remove(stem);

    // 現在のstemRadiusを取得
    const currentStemRadius = parseFloat(document.getElementById('stemRadius').value);

    // 新しいstemオブジェクトを作成
    stem = createHexagonalPrismSimple(stemCenter, currentStemRadius, value, material);
    scene.add(stem);

    // branch Basesも更新
    updateBranchBases(currentStemRadius, value);
});
;

uiControlManager.on('colorChange', (color) => {
    const threeColor = new THREE.Color(color);
    material.color = threeColor;
});

uiControlManager.on('resetCamera', () => {
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 10, 0);
    controller.target.set(0, 10, 0);
    controller.update();
});

// ブランチ生成のイベントハンドラー
uiControlManager.on('growBranch', (branchBase) => {
    branchBase.growBranch(scene);
    // プロパティパネルを更新（ボタンの表示切り替えのため）
    uiControlManager.showBranchProperties(branchBase);
    updateGrapePositionsDisplay(); // UIキャンバスを更新
});

// ブランチ削除のイベントハンドラー
uiControlManager.on('removeBranch', (branchBase) => {
    branchBase.removeBranch(scene);
    // プロパティパネルを更新（ボタンの表示切り替えのため）
    uiControlManager.showBranchProperties(branchBase);
    updateGrapePositionsDisplay(); // UIキャンバスを更新
});

// ブランチ回転のイベントハンドラー
uiControlManager.on('branchRotation', (data) => {
    const { branchBase, rotation } = data;
    branchBase.setRotation(rotation);
    console.log(`Rotated branch base to ${rotation} degrees`);
    updateGrapePositionsDisplay(); // UIキャンバスを更新
});

// ブドウ制御のイベントハンドラー
uiControlManager.on('toggleGrape', (data) => {
    const { branchBase, pinIndex } = data;
    if (branchBase.branch) {
        console.log(`Toggling grape ${pinIndex} for branch`);
        branchBase.branch.toggleGrape(pinIndex);
        branchBase.branch.debugGrapeInfo(); // デバッグ情報を出力
        updateGrapePositionsDisplay(); // UIキャンバスを更新
    }
});

uiControlManager.on('showAllGrapes', (branchBase) => {
    if (branchBase.branch) {
        branchBase.branch.showAllGrapes();
        updateGrapePositionsDisplay(); // UIキャンバスを更新
    }
});

uiControlManager.on('hideAllGrapes', (branchBase) => {
    if (branchBase.branch) {
        branchBase.branch.hideAllGrapes();
        updateGrapePositionsDisplay(); // UIキャンバスを更新
    }
});

uiControlManager.on('grapeSizeChange', (data) => {
    const { branchBase, size } = data;
    if (branchBase.branch) {
        branchBase.branch.updateGrapeSize(size);
        console.log(`Updated grape size to ${size} for branch`);
        updateGrapePositionsDisplay(); // UIキャンバスを更新
    }
});

uiControlManager.on('grapeIndividualSizeChange', (data) => {
    const { branchBase, pinIndex, size } = data;
    if (branchBase.branch) {
        branchBase.branch.updateIndividualGrapeSize(pinIndex, size);
        console.log(`Updated grape ${pinIndex} size to ${size} for branch`);
        updateGrapePositionsDisplay(); // UIキャンバスを更新
    }
});

// CSV出力のイベントハンドラー
uiControlManager.on('exportCsv', () => {
    const visibleGrapes = getAllVisibleGrapePositions();
    uiControlManager.exportGrapePositionsToCSV(visibleGrapes);
});

// branch Basesを更新する関数
function updateBranchBases(stemRadius, stemHeight) {
    // 既存のbranch Basesを削除
    branchBases.forEach(branchBase => {
        scene.remove(branchBase.mesh);
    });
    branchBases.length = 0;

    // 新しいbranch Basesを生成
    const newBranchGenerator = new BranchGenerator();
    newBranchGenerator.stemRadius = stemRadius;
    newBranchGenerator.stemHeight = stemHeight;
    const newBranchBases = newBranchGenerator.generateBranchBases();

    newBranchBases.forEach(branchBase => {
        scene.add(branchBase.mesh);
        branchBases.push(branchBase);
    });

    // ClickBranchBaseControlsのbranchBases配列も更新
    if (clickBranchBaseControls) {
        clickBranchBaseControls.updateBranchBases(branchBases);
    }

    // UIキャンバスを更新
    updateGrapePositionsDisplay();
}

// 全ての表示されているブドウの座標を取得する関数
function getAllVisibleGrapePositions() {
    const allVisibleGrapes = [];

    branchBases.forEach((branchBase, branchBaseIndex) => {
        if (branchBase.hasBranch && branchBase.branch) {
            const visibleGrapes = branchBase.branch.getVisibleGrapePositions();
            visibleGrapes.forEach(grapeInfo => {
                allVisibleGrapes.push({
                    branchBaseIndex: branchBaseIndex,
                    pinIndex: grapeInfo.index,
                    position: grapeInfo.position,
                    size: grapeInfo.size
                });
            });
        }
    });

    return allVisibleGrapes;
}

// UIキャンバスのブドウ座標表示を更新する関数
function updateGrapePositionsDisplay() {
    const visibleGrapes = getAllVisibleGrapePositions();

    // 前回と同じ内容かチェック（パフォーマンス最適化）
    const currentHash = JSON.stringify(visibleGrapes.map(grape => ({
        bi: grape.branchBaseIndex,
        pi: grape.pinIndex,
        x: grape.position.x.toFixed(2),
        y: grape.position.y.toFixed(2),
        z: grape.position.z.toFixed(2),
        s: grape.size
    })));

    if (currentHash !== lastGrapePositionsHash) {
        uiCanvas.updateGrapePositions(visibleGrapes);
        lastGrapePositionsHash = currentHash;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controller.update();
    renderer.render(scene, camera);
}

animate();

//renderer.setAnimationLoop(animate);
//document.body.appendChild(renderer.domElement);

// function animate(){
//     mesh.rotation.y += 0.01;
//     mesh.rotation.x += 0.01;
//     renderer.render(scene, camera);
// }

