import * as THREE from 'three';

/**
 * 輪郭線付きの円柱メッシュを作成する関数
 * radialSegmentsを6にすると六角柱として利用できる
 * @param {number} radius - 円柱の半径
 * @param {number} height - 円柱の高さ
 * @param {number} color - メッシュの色
 * @param {number} radialSegments - 円周方向の分割数（デフォルト: 6）
 * @returns {THREE.Mesh} 輪郭線付きの円柱メッシュ
 */
export function createOutlinedCylinderMesh(radius, height, color, radialSegments = 6) {
    // CylinderGeometryの分割数を指定して円柱または六角柱を作成
    const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }));

    // 形状の境界が見やすいように黒いエッジを追加
    addMeshEdges(mesh, 0.1);
    return mesh;
}

/**
 * 既存メッシュのジオメトリに沿って輪郭線を追加する関数
 * @param {THREE.Mesh} mesh - エッジを追加する対象メッシュ
 * @param {number} thresholdAngle - エッジとして描画する面の角度しきい値
 * @returns {THREE.LineSegments} 追加されたエッジメッシュ
 */
export function addMeshEdges(mesh, thresholdAngle = undefined) {
    // thresholdAngleが指定されている場合は、角度差の大きい境界だけを線として抽出
    const edgeGeometry = thresholdAngle === undefined
        ? new THREE.EdgesGeometry(mesh.geometry)
        : new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edgeMesh = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    mesh.add(edgeMesh);
    return edgeMesh;
}

/**
 * メッシュの既存エッジを破棄して、新しいジオメトリに合わせて再作成する関数
 * ブドウのサイズ変更など、geometryを差し替えた後に使用する
 * @param {THREE.Mesh} mesh - エッジを更新する対象メッシュ
 * @param {number} thresholdAngle - エッジとして描画する面の角度しきい値
 * @returns {THREE.LineSegments} 再作成されたエッジメッシュ
 */
export function replaceMeshEdges(mesh, thresholdAngle = undefined) {
    // 古いエッジのgeometry/materialを破棄してメモリリークを防ぐ
    const existingEdges = mesh.children.filter(child => child instanceof THREE.LineSegments);
    existingEdges.forEach(edge => {
        edge.geometry.dispose();
        edge.material.dispose();
        mesh.remove(edge);
    });

    return addMeshEdges(mesh, thresholdAngle);
}
