/**
 * BranchBaseやBranchのクリック判定に必要なオブジェクト収集を担当するクラス
 * ClickBranchBaseControlsからヒットテストの詳細を分離するために用意している
 */
export class BranchHitTester {
    constructor(branchBases) {
        this.branchBases = branchBases;
    }

    /**
     * stemのサイズ変更などでBranchBaseを再生成したときに参照を更新する
     * @param {BranchBase[]} branchBases - 新しいBranchBase配列
     */
    updateBranchBases(branchBases) {
        this.branchBases = branchBases;
    }

    /**
     * レイキャスト対象になるメッシュと、その子オブジェクトをすべて取得する
     * @returns {THREE.Object3D[]} クリック判定に使うオブジェクト一覧
     */
    getClickableObjects() {
        const objects = [];

        // BranchBase本体だけでなく、エッジなどの子要素もクリック対象に含める
        this.getBranchBaseMeshes().forEach(mesh => {
            this.addObjectWithChildren(mesh, objects);
        });

        // 生成済みのBranch本体と、ジャンクションやブドウなどの子要素も含める
        this.getBranchMeshes().forEach(mesh => {
            this.addObjectWithChildren(mesh, objects);
        });

        return objects;
    }

    /**
     * クリックされたオブジェクトから、対応するBranchBaseを親方向にたどって探す
     * @param {THREE.Object3D} object - レイキャストで当たったオブジェクト
     * @returns {BranchBase|null} 対応するBranchBase。見つからない場合はnull
     */
    findBranchBaseForObject(object) {
        const branchBaseMeshes = this.getBranchBaseMeshes();
        const branchMeshes = this.getBranchMeshes();
        let currentObject = object;

        // 子メッシュがクリックされた場合でも、親をたどってBranchBase/Branch本体を特定する
        while (currentObject) {
            if (branchBaseMeshes.includes(currentObject)) {
                return this.branchBases.find(branchBase => branchBase.mesh === currentObject) || null;
            }

            if (branchMeshes.includes(currentObject)) {
                return this.branchBases.find(
                    branchBase => branchBase.branch && branchBase.branch.mesh === currentObject
                ) || null;
            }

            currentObject = currentObject.parent;
        }

        return null;
    }

    /**
     * BranchBase本体のメッシュだけを取得する
     * @returns {THREE.Mesh[]} BranchBaseのメッシュ一覧
     */
    getBranchBaseMeshes() {
        return this.branchBases.map(branchBase => branchBase.mesh);
    }

    /**
     * すでに生成されているBranch本体のメッシュだけを取得する
     * @returns {THREE.Mesh[]} Branchのメッシュ一覧
     */
    getBranchMeshes() {
        return this.branchBases
            .filter(branchBase => branchBase.hasBranch && branchBase.branch)
            .map(branchBase => branchBase.branch.mesh);
    }

    /**
     * オブジェクト自身とすべての子孫オブジェクトを配列に追加する
     * @param {THREE.Object3D} object - 追加対象の親オブジェクト
     * @param {THREE.Object3D[]} objects - 追加先の配列
     */
    addObjectWithChildren(object, objects) {
        objects.push(object);
        object.children.forEach(child => this.addObjectWithChildren(child, objects));
    }
}
