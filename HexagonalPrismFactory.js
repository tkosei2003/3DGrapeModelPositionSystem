import * as THREE from 'three';
import { addMeshEdges } from './MeshFactory.js';
import { applyAxisRotationToMesh } from './TransformUtils.js';

/**
 * 六角柱のメッシュを作成する関数
 * 幹や土台など、アプリ全体で使う基本形状の生成を担当する
 * @param {THREE.Vector3} faceCenter - 六角柱の底面中心として扱う位置
 * @param {number} radius - 外接円の半径
 * @param {number} height - 六角柱の高さ
 * @param {THREE.Material} material - 使用するマテリアル（未指定の場合は半透明の緑）
 * @param {THREE.Vector3} axis - 六角柱を伸ばす方向（デフォルト: Y軸）
 * @returns {THREE.Mesh} 輪郭線付きの六角柱メッシュ
 */
export function createHexagonalPrism(faceCenter, radius, height, material = null, axis = new THREE.Vector3(0, 1, 0)) {
    // マテリアルが渡されない場合は、確認しやすい半透明のデフォルト色を使う
    const prismMaterial = material || new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
    });

    // CylinderGeometryの分割数を6にすることで六角柱を作成
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 6);
    const mesh = new THREE.Mesh(geometry, prismMaterial);

    // faceCenterを底面中心として、axis方向に伸びるように位置と回転を適用
    applyAxisRotationToMesh(mesh, faceCenter, axis, height);

    // 半透明でも形状の境界が分かるように輪郭線を追加
    addMeshEdges(mesh, 0.1);

    return mesh;
}
