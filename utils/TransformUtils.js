import * as THREE from 'three';

const DEFAULT_UP = new THREE.Vector3(0, 1, 0);

/**
 * Y軸方向を基準に作られたメッシュを任意の軸方向に合わせる関数
 * さらに、その軸周りの追加回転も同時に適用する
 * @param {THREE.Mesh} mesh - 回転と位置を適用する対象メッシュ
 * @param {THREE.Vector3} point - メッシュの底面中心として扱う位置
 * @param {THREE.Vector3} axis - メッシュを伸ばす方向
 * @param {number} height - メッシュの高さ
 * @param {number} rotationDegrees - axis軸周りの追加回転角度（度数）
 */
export function applyAxisRotationToMesh(mesh, point, axis, height, rotationDegrees = 0) {
    // 前回の回転状態が残らないように初期化
    mesh.rotation.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);

    // 軸ベクトルは長さの影響を受けないよう正規化して扱う
    const rotationAxis = axis.clone().normalize();
    const finalQuaternion = new THREE.Quaternion();

    // Three.jsのCylinderGeometryはY軸方向に伸びるため、Y軸から指定軸への回転を作る
    if (!DEFAULT_UP.equals(rotationAxis)) {
        const alignmentQuaternion = new THREE.Quaternion();
        alignmentQuaternion.setFromUnitVectors(DEFAULT_UP, rotationAxis);
        finalQuaternion.copy(alignmentQuaternion);
    }

    // 指定軸に合わせた後、同じ軸周りに追加回転を合成する
    if (rotationDegrees !== 0) {
        const rotationAngle = rotationDegrees * Math.PI / 180;
        const axisRotationQuaternion = new THREE.Quaternion();
        axisRotationQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);
        finalQuaternion.multiplyQuaternions(axisRotationQuaternion, finalQuaternion);
    }

    mesh.quaternion.copy(finalQuaternion);

    // pointを底面中心として扱うため、高さの半分だけ軸方向にずらして中心を配置
    const offset = rotationAxis.clone().multiplyScalar(height / 2);
    mesh.position.copy(point);
    mesh.position.add(offset);
}
