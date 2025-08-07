import * as THREE from 'three';
import { createHexagonalPrismSimple } from './hex.js';
import { createJunctionObject } from './JunctionObject.js';
export class BranchBase {
    constructor(point, axes, radius = 0.3, height = 0.05, color = 0xFFCE7B) {
        this.point = point;
        this.axes = axes;
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.rotation = 0; // axes軸周りの回転角度（度数）
        this.mesh = this.createMesh();
        this.hasBranch = false; // ブランチが生えているかどうか
        this.branch = null; // 生えているブランチの参照
    }

    createMesh() {
        // CylinderGeometryを使用して六角柱を作成（6つのセグメントで六角形）
        const geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 6);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: this.color }));

        // エッジを追加
        const edge = new THREE.EdgesGeometry(mesh.geometry, 0.1);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const edgeMesh = new THREE.LineSegments(edge, edgeMaterial);
        mesh.add(edgeMesh);

        // 位置と回転を適用
        this.applyRotationToMesh(mesh);

        return mesh;
    }

    // ブランチを生やす
    growBranch(scene) {
        if (!this.hasBranch) {
            // ブランチの位置を計算（BranchBaseから軸方向に延長）
            const branchPosition = this.point.clone(); // ブランチの底面がBranchBaseの底面になるように

            this.branch = new Branch(branchPosition, this.axes);
            // ブランチに同じ回転を適用
            this.branch.setRotation(this.rotation);
            scene.add(this.branch.mesh);
            this.hasBranch = true;
        }
    }

    // ブランチを削除
    removeBranch(scene) {
        if (this.hasBranch && this.branch) {
            scene.remove(this.branch.mesh);
            this.branch = null;
            this.hasBranch = false;
        }
    }

    // 回転を設定
    setRotation(rotation) {
        this.rotation = rotation;
        this.updateMeshRotation();

        // ブランチがある場合は、ブランチも回転
        if (this.hasBranch && this.branch) {
            this.branch.setRotation(rotation);
        }
    }

    // メッシュの回転を更新
    updateMeshRotation() {
        if (this.mesh) {
            this.applyRotationToMesh(this.mesh);
        }
    }

    // axes軸周りの回転をメッシュに適用
    applyRotationToMesh(mesh) {
        // メッシュの回転をリセットして基本状態に戻す
        mesh.rotation.set(0, 0, 0);
        mesh.quaternion.set(0, 0, 0, 1);

        // 法線軸（axes）を正規化
        const rotationAxis = this.axes.clone().normalize();

        // デフォルトのY軸から法線軸への配置回転を計算
        const defaultUp = new THREE.Vector3(0, 1, 0);
        let finalQuaternion = new THREE.Quaternion();

        if (!defaultUp.equals(rotationAxis)) {
            // Y軸から法線軸への配置
            const alignmentQuaternion = new THREE.Quaternion();
            alignmentQuaternion.setFromUnitVectors(defaultUp, rotationAxis);
            finalQuaternion.copy(alignmentQuaternion);
        }

        // 法線軸周りの追加回転を適用
        if (this.rotation !== 0) {
            const rotationAngle = this.rotation * Math.PI / 180;

            // 法線軸周りの回転クォータニオンを作成
            const axisRotationQuaternion = new THREE.Quaternion();
            axisRotationQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);

            // 配置回転の後に軸周り回転を適用
            finalQuaternion.multiplyQuaternions(axisRotationQuaternion, finalQuaternion);
        }

        // 最終的なクォータニオンを適用
        mesh.quaternion.copy(finalQuaternion);

        // 位置を設定（法線方向のオフセット付き）
        const offset = rotationAxis.clone().multiplyScalar(this.height / 2);
        mesh.position.copy(this.point);
        mesh.position.add(offset);
    }
}

export class Branch {
    constructor(point, axes, radius = 0.3, height = 0.9, color = 0xFFCE7B) {
        this.point = point;
        this.axes = axes;
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.rotation = 0; // axes軸周りの回転角度（度数）
        this.mesh = this.createMesh();
        this.grapes = []; // 実の配列（ピンごと）
        this.hasGrapes = [false, false, false]; // 各ピンに実があるかどうかのフラグ
        this.initializePinsAndGrapes(); // ピンと実を初期化
    }

    createMesh() {
        // CylinderGeometryを使用して六角柱を作成（6つのセグメントで六角形）
        const geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 6);
        const branch = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: this.color }));

        // エッジを追加
        const edge = new THREE.EdgesGeometry(branch.geometry, 0.1);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const edgeMesh = new THREE.LineSegments(edge, edgeMaterial);
        branch.add(edgeMesh);

        // ジャンクションオブジェクトを作成
        const junctionPoint = new THREE.Vector3(0, this.height / 2 + 0.1, 0);
        const junctionObject = createJunctionObject(junctionPoint);
        // ジャンクションオブジェクトの位置をブランチの先端に回転
        junctionObject.rotation.x = -Math.PI / 2;

        // ジャンクションオブジェクトをブランチに追加
        branch.add(junctionObject);

        // 位置と回転を適用
        this.applyRotationToMesh(branch);

        return branch;
    }

    // 回転を設定
    setRotation(rotation) {
        this.rotation = rotation;
        this.updateMeshRotation();
    }

    // メッシュの回転を更新
    updateMeshRotation() {
        if (this.mesh) {
            this.applyRotationToMesh(this.mesh);
        }
    }

    // axes軸周りの回転をメッシュに適用（BranchBaseと同じロジック）
    applyRotationToMesh(mesh) {
        // メッシュの回転をリセットして基本状態に戻す
        mesh.rotation.set(0, 0, 0);
        mesh.quaternion.set(0, 0, 0, 1);

        // 法線軸（axes）を正規化
        const rotationAxis = this.axes.clone().normalize();

        // デフォルトのY軸から法線軸への配置回転を計算
        const defaultUp = new THREE.Vector3(0, 1, 0);
        let finalQuaternion = new THREE.Quaternion();

        if (!defaultUp.equals(rotationAxis)) {
            // Y軸から法線軸への配置
            const alignmentQuaternion = new THREE.Quaternion();
            alignmentQuaternion.setFromUnitVectors(defaultUp, rotationAxis);
            finalQuaternion.copy(alignmentQuaternion);
        }

        // 法線軸周りの追加回転を適用
        if (this.rotation !== 0) {
            const rotationAngle = this.rotation * Math.PI / 180;

            // 法線軸周りの回転クォータニオンを作成
            const axisRotationQuaternion = new THREE.Quaternion();
            axisRotationQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);

            // 配置回転の後に軸周り回転を適用
            finalQuaternion.multiplyQuaternions(axisRotationQuaternion, finalQuaternion);
        }

        // 最終的なクォータニオンを適用
        mesh.quaternion.copy(finalQuaternion);

        // 位置を設定（法線方向のオフセット付き）
        const offset = rotationAxis.clone().multiplyScalar(this.height / 2);
        mesh.position.copy(this.point);
        mesh.position.add(offset);
    }

    initializePinsAndGrapes() {
        // ジャンクションオブジェクトの構造に基づいて、3つのピンの位置をハードコード
        const junctionObject = this.mesh.children[0]; // ジャンクションオブジェクトは最初の子要素

        // JunctionObject.jsから計算した3つのピンの位置
        // 羽根が120度ずつ回転し、ピンは羽根の先(x*2, y*2, 0)にある
        const pinPositions = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3 - Math.PI / 6; // 120度ずつ回転
            const x = Math.cos(angle) * 1.4142; // x*2なので1.4142/2*2 = 1.4142
            const y = Math.sin(angle) * 1.4142;
            pinPositions.push(new THREE.Vector3(x, 0.55, y));
        }

        // 各ピン位置にブドウを作成
        pinPositions.forEach((pinPos, index) => {
            // ピンの先端の位置（JunctionObject.jsでpinSharpeMeshが1.4の位置にある）
            const grapePosition = new THREE.Vector3(0, 0, 0); // ピンの先端から少し上
            const grape = new grapes(grapePosition, 1.0, this.color); // デフォルトサイズを1.0に変更
            grape.mesh.visible = false; // 初期状態では非表示
            this.grapes.push(grape);

            // ブドウをジャンクションオブジェクトに追加（相対位置で配置）
            const grapeContainer = new THREE.Group();
            grapeContainer.position.copy(pinPos);
            grapeContainer.add(grape.mesh);
            junctionObject.add(grapeContainer);

            console.log(`Created grape ${index} at pin position:`, pinPos, 'grape local position:', grapePosition);
        });

        console.log(`Total grapes created: ${this.grapes.length}`);
    }

    // 指定したピンのブドウの表示/非表示を切り替え
    toggleGrape(pinIndex) {
        if (pinIndex >= 0 && pinIndex < this.grapes.length) {
            this.hasGrapes[pinIndex] = !this.hasGrapes[pinIndex];
            this.grapes[pinIndex].mesh.visible = this.hasGrapes[pinIndex];
        }
    }

    // 指定したピンのブドウを表示
    showGrape(pinIndex) {
        if (pinIndex >= 0 && pinIndex < this.grapes.length) {
            this.hasGrapes[pinIndex] = true;
            this.grapes[pinIndex].mesh.visible = true;
        }
    }

    // 指定したピンのブドウを非表示
    hideGrape(pinIndex) {
        if (pinIndex >= 0 && pinIndex < this.grapes.length) {
            this.hasGrapes[pinIndex] = false;
            this.grapes[pinIndex].mesh.visible = false;
        }
    }

    // 全てのブドウを表示
    showAllGrapes() {
        for (let i = 0; i < this.grapes.length; i++) {
            this.showGrape(i);
        }
    }

    // 全てのブドウを非表示
    hideAllGrapes() {
        for (let i = 0; i < this.grapes.length; i++) {
            this.hideGrape(i);
        }
    }

    // ブドウの状態を取得
    getGrapeStates() {
        return [...this.hasGrapes];
    }

    // デバッグ用：ピンとブドウの情報を出力
    debugGrapeInfo() {
        console.log('Branch Debug Info:');
        console.log('Grapes count:', this.grapes.length);
        console.log('HasGrapes states:', this.hasGrapes);
        this.grapes.forEach((grape, index) => {
            console.log(`Grape ${index}: visible=${grape.mesh.visible}, hasGrape=${this.hasGrapes[index]}`);
        });
    }

    // ブドウのサイズを変更
    updateGrapeSize(newSize) {
        this.grapes.forEach(grape => {
            grape.updateSize(newSize);
        });
    }

    // 指定したピンのブドウのサイズを変更
    updateIndividualGrapeSize(pinIndex, newSize) {
        if (pinIndex >= 0 && pinIndex < this.grapes.length) {
            this.grapes[pinIndex].updateSize(newSize);
            console.log(`Updated grape ${pinIndex} size to ${newSize}`);
        }
    }

    // 現在表示されているブドウの中心座標を取得
    getVisibleGrapePositions() {
        const visiblePositions = [];

        this.grapes.forEach((grape, index) => {
            if (grape.mesh.visible && this.hasGrapes[index]) {
                // ブランチのワールド座標系での位置を計算
                const worldPosition = new THREE.Vector3();
                grape.mesh.getWorldPosition(worldPosition);

                visiblePositions.push({
                    index: index,
                    position: worldPosition,
                    size: grape.radius
                });
            }
        });

        return visiblePositions;
    }
}

export class grapes {
    constructor(position, radius = 1.0, color = 0xFFCE7B) {
        this.position = position.clone(); // positionをクローンして保持
        this.radius = radius;
        this.color = color;
        this.mesh = this.createMesh();
        this.updateEdge(); // 初期エッジを作成
        this.updatePosition(); // 初期位置を設定
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: this.color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(this.position);
        return sphere;
    }

    // サイズを更新
    updateSize(newRadius) {
        this.radius = newRadius;

        // 既存のジオメトリを削除して新しいものを作成
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        // エッジを再描画
        this.updateEdge();

        // サイズに応じて位置も調整
        this.updatePosition();
    }

    // エッジを更新
    updateEdge() {
        // 既存のエッジを削除
        const existingEdge = this.mesh.children.find(child => child instanceof THREE.LineSegments);
        if (existingEdge) {
            existingEdge.geometry.dispose();
            existingEdge.material.dispose();
            this.mesh.remove(existingEdge);
        }

        // 新しいエッジを作成
        const grapeEdge = new THREE.EdgesGeometry(this.mesh.geometry);
        const grapeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const grapeEdgeMesh = new THREE.LineSegments(grapeEdge, grapeEdgeMaterial);
        this.mesh.add(grapeEdgeMesh);
    }

    // サイズに応じて位置を更新
    updatePosition() {
        // サイズに基づいて Y 位置を調整
        // 小さいブドウ(1.0): Y = 1.6, 大きいブドウ(1.5): Y = 1.9
        const baseY = 1.6;
        let sizeOffset = 0;

        if (this.radius === 1.0) {
            sizeOffset = 0; // ベースポジション
        } else if (this.radius === 1.5) {
            sizeOffset = 0.5; // 大きいブドウはより遠くに
        } else {
            // その他のサイズの場合は線形補間
            sizeOffset = (this.radius - 1.0);
        }

        const newY = baseY + sizeOffset;
        this.position.y = newY;
        this.mesh.position.copy(this.position);

        console.log(`Grape size: ${this.radius}, position Y: ${newY}`);
    }
}
