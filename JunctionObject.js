//ブランチの先にあるジャンクションオブジェクトの生成関数
//3枚の羽根を持つプロペラのような形状を持つオブジェクトを生成する
//それぞれの羽根の先には羽根に垂直になるようにピンがあり、そこに実がなる

import * as THREE from 'three';

export function createJunctionObject(position) {
    const group = new THREE.Group();

    // 羽根の形状を作成
    const bladeGeometry = new THREE.BoxGeometry(1.4142, 1, 0.2);
    const bladeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFCE7B });

    for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.rotation.z = (i * Math.PI * 2) / 3 + Math.PI / 6; // 120度ずつ回転
        const x = Math.cos(blade.rotation.z)*1.4142/2; // 羽根の位置を調整
        const y = Math.sin(blade.rotation.z)*1.4142/2; // 羽根の位置を調整
        blade.position.add(new THREE.Vector3(x, y, 0)); // 羽根の位置を調整
        group.add(blade);
        // 羽根の先にピンを追加
        const pinBaseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2);
        const pinBaseTrapezoidGeometry = new THREE.CylinderGeometry(0.1, 0.5, 0.5);
        const pinGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0);
        const pinSharpeGeometry = new THREE.CylinderGeometry(0, 0.1, 0.1);
        const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xFFCE7B });
        const pin = new THREE.Mesh(pinBaseGeometry, pinMaterial);
        
        // トラペゾイドメッシュを作成して位置を設定してからピンに追加
        const trapezoidMesh = new THREE.Mesh(pinBaseTrapezoidGeometry, pinMaterial);
        // ピンベースの高さ(0.2)の半分 + トラペゾイドの高さ(0.5)の半分 = 0.1 + 0.25 = 0.35
        trapezoidMesh.position.set(0, 0.35, 0); // ピンベースの表面ぴったりに配置
        pin.add(trapezoidMesh);

        const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
        pinMesh.position.set(0, 0.85, 0); // ピンの先に位置
        pin.add(pinMesh);

        const pinSharpeMesh = new THREE.Mesh(pinSharpeGeometry, pinMaterial);
        pinSharpeMesh.position.set(0, 1.4, 0); // ピンの先に位置
        pin.add(pinSharpeMesh);
        
        pin.position.set(x*2, y*2, 0); // 羽根の先に位置
        pin.rotation.x = Math.PI / 2; // ピンを垂直に配置
        group.add(pin);
        
        
        // 各メッシュにエッジを追加
        // 羽根のエッジ
        const bladeEdge = new THREE.EdgesGeometry(blade.geometry);
        const bladeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const bladeEdgeMesh = new THREE.LineSegments(bladeEdge, bladeEdgeMaterial);
        blade.add(bladeEdgeMesh);
        
        // ピンのエッジ
        const pinEdge = new THREE.EdgesGeometry(pin.geometry);
        const pinEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const pinEdgeMesh = new THREE.LineSegments(pinEdge, pinEdgeMaterial);
        pin.add(pinEdgeMesh);
        
        // トラペゾイドのエッジ
        const trapezoidEdge = new THREE.EdgesGeometry(trapezoidMesh.geometry);
        const trapezoidEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const trapezoidEdgeMesh = new THREE.LineSegments(trapezoidEdge, trapezoidEdgeMaterial);
        trapezoidMesh.add(trapezoidEdgeMesh);
        
        const pinMeshEdge = new THREE.EdgesGeometry(pinMesh.geometry);
        const pinMeshEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const pinMeshEdgeMesh = new THREE.LineSegments(pinMeshEdge, pinMeshEdgeMaterial);
        pinMesh.add(pinMeshEdgeMesh);

        const pinSharpeMeshEdge = new THREE.EdgesGeometry(pinSharpeMesh.geometry);
        const pinSharpeMeshEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const pinSharpeMeshEdgeMesh = new THREE.LineSegments(pinSharpeMeshEdge, pinSharpeMeshEdgeMaterial);
        pinSharpeMesh.add(pinSharpeMeshEdgeMesh);
    }

    group.position.copy(position);
    return group;
}