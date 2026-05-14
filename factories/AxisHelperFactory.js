import * as THREE from 'three';

/**
 * 3D空間のX/Y/Z軸を表示するヘルパーを作成する関数
 * ブランチの向きや座標を確認しやすくするために使用する
 * @param {number} size - 軸の長さ（デフォルト: 10）
 * @param {number} lineWidth - 線の太さ（デフォルト: 3）
 * @returns {THREE.Group} 軸線とラベルをまとめたグループ
 */
export function createAxisHelper(size = 10, lineWidth = 3) {
    const axisGroup = new THREE.Group();

    // X/Y/Z軸を赤・緑・青の線として追加
    axisGroup.add(createAxisLine(new THREE.Vector3(size, 0, 0), 0xff0000, lineWidth));
    axisGroup.add(createAxisLine(new THREE.Vector3(0, size, 0), 0x00ff00, lineWidth));
    axisGroup.add(createAxisLine(new THREE.Vector3(0, 0, size), 0x0000ff, lineWidth));

    // 各軸の先端にCanvasTextureで作成した文字ラベルを配置
    axisGroup.add(createAxisLabel('X', 'red', new THREE.Vector3(size + 0.5, 0, 0)));
    axisGroup.add(createAxisLabel('Y', 'green', new THREE.Vector3(0, size + 0.5, 0)));
    axisGroup.add(createAxisLabel('Z', 'blue', new THREE.Vector3(0, 0, size + 0.5)));

    // 他のオブジェクトより前面寄りに描画されるように優先度を上げる
    axisGroup.renderOrder = 999;

    return axisGroup;
}

/**
 * 原点から指定した終点までの軸線を作成する関数
 * @param {THREE.Vector3} endPoint - 軸線の終点
 * @param {number} color - 軸線の色
 * @param {number} lineWidth - 軸線の太さ
 * @returns {THREE.Line} 軸線オブジェクト
 */
function createAxisLine(endPoint, color, lineWidth) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        endPoint
    ]);
    const material = new THREE.LineBasicMaterial({ color, linewidth: lineWidth });

    return new THREE.Line(geometry, material);
}

/**
 * 軸名を表示するスプライトラベルを作成する関数
 * @param {string} text - 表示する文字
 * @param {string} color - 文字色
 * @param {THREE.Vector3} position - ラベルの配置位置
 * @returns {THREE.Sprite} 軸ラベルのスプライト
 */
function createAxisLabel(text, color, position) {
    // Canvasに文字を書き、そのCanvasをテクスチャとしてSpriteに貼り付ける
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    context.font = '48px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(text, 32, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(material);
    label.position.copy(position);
    label.scale.set(0.5, 0.5, 1);

    return label;
}
