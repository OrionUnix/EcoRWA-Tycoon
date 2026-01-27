'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function CameraRig() {
    const { camera, controls, gl } = useThree() as any;
    const [keys, setKeys] = useState<Record<string, boolean>>({});
    const isRightMouseDown = useRef(false);

    const target = useRef(new THREE.Vector3(0, 0, 0));
    const offset = useRef(new THREE.Vector3(40, 40, 40));

    const moveSpeed = 0.6;
    const rotateSpeed = 0.05;
    const zoomSpeed = 3.0;

    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            // On stocke la touche (ex: 'z') et le code physique (ex: 'KeyW')
            setKeys(v => ({ ...v, [e.key.toLowerCase()]: true, [e.code.toLowerCase()]: true }));
        };
        const handleUp = (e: KeyboardEvent) => {
            setKeys(v => ({ ...v, [e.key.toLowerCase()]: false, [e.code.toLowerCase()]: false }));
        };

        const preventContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleMouseDown = (e: MouseEvent) => { if (e.button === 2) isRightMouseDown.current = true; };
        const handleMouseUp = (e: MouseEvent) => { if (e.button === 2) isRightMouseDown.current = false; };

        const handleMouseMove = (e: MouseEvent) => {
            if (isRightMouseDown.current) {
                // Rotation horizontale
                const rotX = -e.movementX * 0.005;
                offset.current.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotX);

                // Inclinaison (Pitch)
                const right = new THREE.Vector3().crossVectors(offset.current, new THREE.Vector3(0, 1, 0)).normalize();
                const pitchAmount = e.movementY * 0.005;
                const newOffset = offset.current.clone().applyAxisAngle(right, pitchAmount);

                // Limites d'inclinaison
                const angle = newOffset.angleTo(new THREE.Vector3(0, 1, 0));
                if (angle > 0.3 && angle < Math.PI / 2.2) {
                    offset.current.copy(newOffset);
                }
            }
        };

        const handleWheel = (e: WheelEvent) => {
            const dir = new THREE.Vector3().copy(offset.current).normalize();
            if (e.deltaY > 0) {
                if (offset.current.length() < 150) offset.current.addScaledVector(dir, zoomSpeed);
            } else {
                if (offset.current.length() > 10) offset.current.addScaledVector(dir, -zoomSpeed);
            }
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        gl.domElement.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        gl.domElement.addEventListener('wheel', handleWheel);
        gl.domElement.addEventListener('contextmenu', preventContextMenu);

        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            gl.domElement.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            gl.domElement.removeEventListener('wheel', handleWheel);
            gl.domElement.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [gl.domElement]);

    useFrame(() => {
        if (!controls) return;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // LOGIQUE UNIVERSELLE :
        // keys['z'] marche pour FR, keys['keyw'] marche pour US (touche physique en haut à gauche)

        // Avancer
        if (keys['z'] || keys['keyw'] || keys['arrowup']) target.current.addScaledVector(forward, moveSpeed);
        // Reculer
        if (keys['s'] || keys['keys'] || keys['arrowdown']) target.current.addScaledVector(forward, -moveSpeed);
        // Gauche
        if (keys['q'] || keys['keya'] || keys['arrowleft']) target.current.addScaledVector(right, -moveSpeed);
        // Droite
        if (keys['d'] || keys['keyd'] || keys['arrowright']) target.current.addScaledVector(right, moveSpeed);

        // Rotations clavier (A/E pour FR, Q/E pour US)
        if (keys['a'] || keys['keyq']) offset.current.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
        if (keys['e'] || keys['keye']) offset.current.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);

        camera.position.copy(target.current).add(offset.current);
        camera.lookAt(target.current);
        controls.target.copy(target.current);
        controls.update();
    });

    return null;
}