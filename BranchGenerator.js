import * as THREE from 'three';
import { createHexagonalPrismSimple } from './hex.js';
import { BranchBase } from './ObjectClass.js';

export class BranchGenerator {
    constructor(stemRadius = 0.7, stemHeight = 19) {
        this.branchBases = [];
        this.material = new THREE.MeshBasicMaterial({ color: 0xFFCE7B });
        this.stemRadius = stemRadius;
        this.stemHeight = stemHeight;
    }

    generateBranchBases() {
        this.branchBases = [];

        // 六角柱の6つの面に対応する法線ベクトルを計算
        const hexFaces = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3; // 60度ずつ
            const normalX = Math.cos(angle);
            const normalZ = Math.sin(angle);
            const faceNormal = new THREE.Vector3(normalX, 0, normalZ);
            hexFaces.push(faceNormal);
        }

        // 各面に沿ってbranch Baseを配置
        let branchIndex = 0;
        for (let face = 0; face < 6; face++) {
            const faceNormal = hexFaces[face];

            // 各面に複数のbranch Baseを配置（高さ方向に）
            let branchesPerFace = 3; // 1面あたりのbranch Base数
            let initialHeight = 4; // 初期高さ
            if (face % 2 == 0) {
                // 最初の面は2つのbranch Baseを配置
                branchesPerFace = 2;
                initialHeight = 7.4902; // 最初の面の初期高さを変更
            }
            for (let heightIndex = 0; heightIndex < branchesPerFace; heightIndex++) {
                // Y座標（高さ）を計算
                const y = initialHeight + (heightIndex * 7.5);

                // stemの表面上の位置を計算
                const surfaceX = faceNormal.x * this.stemRadius * Math.sqrt(3) / 2; // 六角形の外接円半径を考慮
                const surfaceZ = faceNormal.z * this.stemRadius * Math.sqrt(3) / 2;

                // branch Baseの位置
                const branchPosition = new THREE.Vector3(surfaceX, y, surfaceZ);

                // 軸方向（stemの表面から外向き）
                const branchAxis = faceNormal.clone();

                // BranchBaseインスタンスを作成
                this.branchBases[branchIndex] = new BranchBase(
                    branchPosition,
                    branchAxis,
                    0.3,
                    0.05,
                    0xFFCE7B
                );

                branchIndex++;
            }
        }

        return this.branchBases;
    }
}