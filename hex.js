import * as THREE from 'three';

/**
 * 六角柱のメッシュを作成する関数
 * @param {THREE.Vector3} faceCenter - 六角形面の中心点
 * @param {number} radius - 外接円の半径
 * @param {number} height - 高さ
 * @param {THREE.Material} material - マテリアル（オプション）
 * @returns {THREE.Mesh} 六角柱のメッシュ
 */
export function createHexagonalPrism(faceCenter, radius, height, material = null) {
    // デフォルトマテリアル
    if (!material) {
        material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
    }

    // 六角形の頂点を計算
    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];

    // 六角形の6つの頂点を計算（上面と下面）
    const hexVertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3; // 60度ずつ
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        hexVertices.push(new THREE.Vector3(x, 0, z));
    }

    // 上面の頂点（中心 + height/2）
    const topCenter = vertices.length / 3;
    vertices.push(0, height / 2, 0); // 上面の中心
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i < 6; i++) {
        const vertex = hexVertices[i];
        vertices.push(vertex.x, height / 2, vertex.z);
        normals.push(0, 1, 0);

        // UV座標（上面用）
        const u = (vertex.x / radius + 1) * 0.5;
        const v = (vertex.z / radius + 1) * 0.5;
        uvs.push(u, v);
    }

    // 下面の頂点（中心 - height/2）
    const bottomCenter = vertices.length / 3;
    vertices.push(0, -height / 2, 0); // 下面の中心
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i < 6; i++) {
        const vertex = hexVertices[i];
        vertices.push(vertex.x, -height / 2, vertex.z);
        normals.push(0, -1, 0);

        // UV座標（下面用）
        const u = (vertex.x / radius + 1) * 0.5;
        const v = (vertex.z / radius + 1) * 0.5;
        uvs.push(u, v);
    }

    // 上面の三角形（中心から各辺へ）
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        indices.push(topCenter, topCenter + 1 + i, topCenter + 1 + next);
    }

    // 下面の三角形（時計回りで裏返し）
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        indices.push(bottomCenter, bottomCenter + 1 + next, bottomCenter + 1 + i);
    }

    // 側面の四角形（各辺）
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;

        const topCurrent = topCenter + 1 + i;
        const topNext = topCenter + 1 + next;
        const bottomCurrent = bottomCenter + 1 + i;
        const bottomNext = bottomCenter + 1 + next;

        // 側面の法線を計算
        const edge1 = hexVertices[next].clone().sub(hexVertices[i]);
        const edge2 = new THREE.Vector3(0, height, 0);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

        // 側面の頂点に法線を追加（既存の法線を更新）
        const normalIndex = topCurrent * 3;
        normals[normalIndex] = normal.x;
        normals[normalIndex + 1] = 0; // Y成分は0（水平）
        normals[normalIndex + 2] = normal.z;

        // 側面の四角形を2つの三角形に分割
        indices.push(topCurrent, bottomCurrent, topNext);
        indices.push(topNext, bottomCurrent, bottomNext);
    }

    // ジオメトリを作成
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // 法線を再計算（より正確な結果のため）
    geometry.computeVertexNormals();

    // メッシュを作成
    const mesh = new THREE.Mesh(geometry, material);

    // 六角形面の中心点に配置（六角柱の中心は面の中心から高さの半分だけオフセット）
    mesh.position.copy(faceCenter);

    return mesh;
}

/**
 * より簡単な方法でCylinderGeometryを使用して六角柱を作成
 * @param {THREE.Vector3} faceCenter - 六角形面の中心点
 * @param {number} radius - 外接円の半径
 * @param {number} height - 高さ
 * @param {THREE.Material} material - マテリアル（オプション）
 * @param {THREE.Vector3} axis - 軸の方向（デフォルト: Y軸）
 * @returns {THREE.Mesh} 六角柱のメッシュ
 */
export function createHexagonalPrismSimple(faceCenter, radius, height, material = null, axis = new THREE.Vector3(0, 1, 0)) {
    // デフォルトマテリアル
    if (!material) {
        material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
    }

    // CylinderGeometryを使用（6つのセグメントで六角形）
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 6);
    const mesh = new THREE.Mesh(geometry, material);

    // 六角形面の中心点に配置
    mesh.position.copy(faceCenter);
    
    // 軸の方向に合わせてメッシュを回転
    const defaultUp = new THREE.Vector3(0, 1, 0);
    if (!axis.equals(defaultUp)) {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultUp, axis.clone().normalize());
        mesh.setRotationFromQuaternion(quaternion);
    }
    
    // 六角柱の中心を面の中心から高さの半分だけオフセット
    const axisNormalized = axis.clone().normalize();
    const offset = axisNormalized.multiplyScalar(height / 2);
    mesh.position.add(offset);
    const edge = new THREE.EdgesGeometry(mesh.geometry, 0.1);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edgeMesh = new THREE.LineSegments(edge, edgeMaterial);
    mesh.add(edgeMesh);
    return mesh;
}

/**
 * XYZ軸を描画するヘルパー関数
 * @param {number} size - 軸の長さ（デフォルト: 5）
 * @param {number} lineWidth - 線の太さ（デフォルト: 3）
 * @returns {THREE.Group} 軸のグループオブジェクト
 */
export function createAxisHelper(size = 10, lineWidth = 3) {
    const axisGroup = new THREE.Group();

    // X軸（赤）
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(size, 0, 0)
    ]);
    const xMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: lineWidth
    });
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    axisGroup.add(xAxis);

    // Y軸（緑）
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, size, 0)
    ]);
    const yMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: lineWidth
    });
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    axisGroup.add(yAxis);

    // Z軸（青）
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, size)
    ]);
    const zMaterial = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: lineWidth
    });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    axisGroup.add(zAxis);

    // 軸ラベル用のテキストスプライト（オプション）
    // X軸ラベル
    const xLabelCanvas = document.createElement('canvas');
    const xLabelContext = xLabelCanvas.getContext('2d');
    xLabelCanvas.width = 64;
    xLabelCanvas.height = 64;
    xLabelContext.font = '48px Arial';
    xLabelContext.fillStyle = 'red';
    xLabelContext.textAlign = 'center';
    xLabelContext.fillText('X', 32, 40);

    const xLabelTexture = new THREE.CanvasTexture(xLabelCanvas);
    const xLabelMaterial = new THREE.SpriteMaterial({ map: xLabelTexture });
    const xLabel = new THREE.Sprite(xLabelMaterial);
    xLabel.position.set(size + 0.5, 0, 0);
    xLabel.scale.set(0.5, 0.5, 1);
    axisGroup.add(xLabel);

    // Y軸ラベル
    const yLabelCanvas = document.createElement('canvas');
    const yLabelContext = yLabelCanvas.getContext('2d');
    yLabelCanvas.width = 64;
    yLabelCanvas.height = 64;
    yLabelContext.font = '48px Arial';
    yLabelContext.fillStyle = 'green';
    yLabelContext.textAlign = 'center';
    yLabelContext.fillText('Y', 32, 40);

    const yLabelTexture = new THREE.CanvasTexture(yLabelCanvas);
    const yLabelMaterial = new THREE.SpriteMaterial({ map: yLabelTexture });
    const yLabel = new THREE.Sprite(yLabelMaterial);
    yLabel.position.set(0, size + 0.5, 0);
    yLabel.scale.set(0.5, 0.5, 1);
    axisGroup.add(yLabel);

    // Z軸ラベル
    const zLabelCanvas = document.createElement('canvas');
    const zLabelContext = zLabelCanvas.getContext('2d');
    zLabelCanvas.width = 64;
    zLabelCanvas.height = 64;
    zLabelContext.font = '48px Arial';
    zLabelContext.fillStyle = 'blue';
    zLabelContext.textAlign = 'center';
    zLabelContext.fillText('Z', 32, 40);

    const zLabelTexture = new THREE.CanvasTexture(zLabelCanvas);
    const zLabelMaterial = new THREE.SpriteMaterial({ map: zLabelTexture });
    const zLabel = new THREE.Sprite(zLabelMaterial);
    zLabel.position.set(0, 0, size + 0.5);
    zLabel.scale.set(0.5, 0.5, 1);
    axisGroup.add(zLabel);

    // 最上位に描画するため、renderOrderを高く設定
    axisGroup.renderOrder = 999;

    return axisGroup;
}

/**
 * よりシンプルな軸ヘルパー（Three.jsの標準AxesHelperを使用）
 * @param {number} size - 軸の長さ（デフォルト: 5）
 * @returns {THREE.AxesHelper} 軸ヘルパーオブジェクト
 */
export function createSimpleAxisHelper(size = 10) {
    const axesHelper = new THREE.AxesHelper(size);
    // 最上位に描画するため、renderOrderを高く設定
    axesHelper.renderOrder = 999;
    return axesHelper;
}