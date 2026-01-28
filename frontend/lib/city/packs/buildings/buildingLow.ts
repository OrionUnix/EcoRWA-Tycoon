import * as THREE from 'three';

export interface BuildingConfig {
  width: number;
  height: number;
  depth: number;
  color: string;
  forSale?: boolean;
  price?: string;
}

export function createLowPolyBuilding(config: BuildingConfig): THREE.Group {
  const building = new THREE.Group();

  // Corps du bâtiment (low-poly = BoxGeometry simple)
  const bodyGeometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: config.color,
    flatShading: true, // Look low-poly
    roughness: 0.7,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = config.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);

  // Toit pyramidal
  const roofGeometry = new THREE.ConeGeometry(config.width * 0.7, 1, 4);
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color).multiplyScalar(0.6),
    flatShading: true,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = config.height + 0.5;
  roof.rotation.y = Math.PI / 4;
  building.add(roof);

  // Fenêtres (petits cubes émissifs)
  const windowGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: '#fbbf24',
    emissiveIntensity: 0.6,
  });

  const floors = Math.floor(config.height / 1.5);
  for (let floor = 0; floor < floors; floor++) {
    for (let col = 0; col < 2; col++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        (col - 0.5) * (config.width / 3),
        floor * 1.5 + 1,
        config.depth / 2 + 0.01
      );
      building.add(window);
    }
  }

  // Panneau "À VENDRE" si forSale
  if (config.forSale) {
    const signGroup = createForSaleSign(config.price || '150 USDC');
    signGroup.position.set(0, config.height + 1.5, config.depth / 2);
    building.add(signGroup);
  }

  return building;
}

function createForSaleSign(price: string): THREE.Group {
  const sign = new THREE.Group();

  // Panneau
  const panelGeometry = new THREE.BoxGeometry(1.5, 0.6, 0.1);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: '#dc2626',
    emissive: '#ef4444',
    emissiveIntensity: 0.5,
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  sign.add(panel);

  // Texte "À VENDRE" (avec canvas texture)
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('À VENDRE', 128, 50);
  ctx.font = '30px Arial';
  ctx.fillText(price, 128, 95);

  const texture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.5),
    textMaterial
  );
  textPlane.position.z = 0.06;
  sign.add(textPlane);

  return sign;
}