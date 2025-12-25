"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Text, RoundedBox } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import * as THREE from "three";

// Constants
const SEGMENT_COUNT = 25;
const SEGMENT_LENGTH = 0.08;
const ROPE_THICKNESS = 0.02;
const GRAVITY = -0.015;
const DAMPING = 0.98;
const CONSTRAINT_ITERATIONS = 10;

interface RopeSegment {
    position: THREE.Vector3;
    prevPosition: THREE.Vector3;
    locked: boolean;
}

function createRopeSegments(startPos: THREE.Vector3): RopeSegment[] {
    const segments: RopeSegment[] = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
        const pos = new THREE.Vector3(
            startPos.x,
            startPos.y - i * SEGMENT_LENGTH,
            startPos.z
        );
        segments.push({
            position: pos.clone(),
            prevPosition: pos.clone(),
            locked: i === 0,
        });
    }
    return segments;
}

function Badge({
    position,
    rotation,
}: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
}) {
    const meshRef = useRef<THREE.Group>(null);

    return (
        <group ref={meshRef} position={position} rotation={rotation}>
            {/* Main badge body with glass effect */}
            <RoundedBox
                args={[1.2, 1.6, 0.08]}
                radius={0.08}
                smoothness={4}
                position={[0, 0, 0]}
            >
                <meshPhysicalMaterial
                    color="#1a1a2e"
                    metalness={0.1}
                    roughness={0.2}
                    transmission={0.9}
                    thickness={0.5}
                    ior={1.5}
                    transparent
                    opacity={0.95}
                />
            </RoundedBox>

            {/* Inner card background */}
            <RoundedBox
                args={[1.1, 1.5, 0.02]}
                radius={0.06}
                smoothness={4}
                position={[0, 0, 0.04]}
            >
                <meshStandardMaterial color="#0f0f1a" metalness={0.3} roughness={0.4} />
            </RoundedBox>

            {/* Gradient accent bar */}
            <mesh position={[0, 0.55, 0.06]}>
                <planeGeometry args={[1.0, 0.15]} />
                <meshBasicMaterial color="#6366f1" />
            </mesh>

            {/* Avatar circle background */}
            <mesh position={[0, 0.15, 0.06]}>
                <circleGeometry args={[0.28, 32]} />
                <meshStandardMaterial
                    color="#4f46e5"
                    metalness={0.5}
                    roughness={0.3}
                />
            </mesh>

            {/* Avatar inner circle */}
            <mesh position={[0, 0.15, 0.07]}>
                <circleGeometry args={[0.25, 32]} />
                <meshStandardMaterial
                    color="#818cf8"
                    metalness={0.2}
                    roughness={0.5}
                />
            </mesh>

            {/* SC initials */}
            <Text
                position={[0, 0.15, 0.08]}
                fontSize={0.18}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                SC
            </Text>

            {/* Name */}
            <Text
                position={[0, -0.2, 0.06]}
                fontSize={0.1}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                maxWidth={1}
            >
                Sharath Chenna
            </Text>

            {/* Title */}
            <Text
                position={[0, -0.38, 0.06]}
                fontSize={0.065}
                color="#a5b4fc"
                anchorX="center"
                anchorY="middle"
                maxWidth={1}
            >
                Software Developer
            </Text>

            {/* Location */}
            <Text
                position={[0, -0.52, 0.06]}
                fontSize={0.05}
                color="#64748b"
                anchorX="center"
                anchorY="middle"
                maxWidth={1}
            >
                Hyderabad, India
            </Text>

            {/* Badge clip at top */}
            <mesh position={[0, 0.85, 0]}>
                <boxGeometry args={[0.15, 0.1, 0.12]} />
                <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Clip hole */}
            <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.13, 16]} />
                <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}

function Rope({
    segments,
    color = "#6366f1",
}: {
    segments: RopeSegment[];
    color?: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const points = segments.map((s) => s.position);
        const curve = new THREE.CatmullRomCurve3(points);
        return new THREE.TubeGeometry(curve, 64, ROPE_THICKNESS, 8, false);
    }, [segments]);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.geometry.dispose();
            meshRef.current.geometry = geometry;
        }
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
        </mesh>
    );
}

function InteractiveLanyard() {
    const { camera, gl } = useThree();
    const [segments, setSegments] = useState<RopeSegment[]>(() =>
        createRopeSegments(new THREE.Vector3(0, 2.5, 0))
    );
    const [isDragging, setIsDragging] = useState(false);
    const [draggedSegment, setDraggedSegment] = useState<number | null>(null);
    const mousePos = useRef(new THREE.Vector3());
    const raycaster = useRef(new THREE.Raycaster());
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

    // Physics simulation
    useFrame(() => {
        setSegments((prevSegments) => {
            const newSegments = prevSegments.map((s) => ({
                ...s,
                position: s.position.clone(),
                prevPosition: s.prevPosition.clone(),
            }));

            // Verlet integration
            for (let i = 0; i < newSegments.length; i++) {
                if (newSegments[i].locked) continue;
                if (isDragging && i === draggedSegment) {
                    newSegments[i].position.copy(mousePos.current);
                    continue;
                }

                const segment = newSegments[i];
                const velocity = segment.position.clone().sub(segment.prevPosition);
                velocity.multiplyScalar(DAMPING);

                segment.prevPosition.copy(segment.position);
                segment.position.add(velocity);
                segment.position.y += GRAVITY;
            }

            // Constraint solving
            for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
                for (let i = 0; i < newSegments.length - 1; i++) {
                    const segA = newSegments[i];
                    const segB = newSegments[i + 1];

                    const diff = segB.position.clone().sub(segA.position);
                    const dist = diff.length();
                    const error = dist - SEGMENT_LENGTH;
                    const correction = diff.normalize().multiplyScalar(error * 0.5);

                    if (!segA.locked) {
                        segA.position.add(correction);
                    }
                    if (!segB.locked && !(isDragging && i + 1 === draggedSegment)) {
                        segB.position.sub(correction);
                    }
                }
            }

            return newSegments;
        });
    });

    // Mouse interaction handlers
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycaster.current.setFromCamera(mouse, camera);

            // Check if we hit any segment (expanded hit area for badge)
            for (let i = segments.length - 1; i >= 0; i--) {
                const hitRadius = i >= segments.length - 5 ? 0.8 : 0.15;
                const dist = raycaster.current.ray.distanceToPoint(segments[i].position);
                if (dist < hitRadius) {
                    setIsDragging(true);
                    setDraggedSegment(i);
                    break;
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycaster.current.setFromCamera(mouse, camera);
            const intersect = new THREE.Vector3();
            raycaster.current.ray.intersectPlane(plane.current, intersect);
            mousePos.current.copy(intersect);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDraggedSegment(null);
        };

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((touch.clientX - rect.left) / rect.width) * 2 - 1,
                -((touch.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycaster.current.setFromCamera(mouse, camera);

            for (let i = segments.length - 1; i >= 0; i--) {
                const hitRadius = i >= segments.length - 5 ? 0.8 : 0.15;
                const dist = raycaster.current.ray.distanceToPoint(segments[i].position);
                if (dist < hitRadius) {
                    setIsDragging(true);
                    setDraggedSegment(i);
                    break;
                }
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((touch.clientX - rect.left) / rect.width) * 2 - 1,
                -((touch.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycaster.current.setFromCamera(mouse, camera);
            const intersect = new THREE.Vector3();
            raycaster.current.ray.intersectPlane(plane.current, intersect);
            mousePos.current.copy(intersect);
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            setDraggedSegment(null);
        };

        gl.domElement.addEventListener("mousedown", handleMouseDown);
        gl.domElement.addEventListener("mousemove", handleMouseMove);
        gl.domElement.addEventListener("mouseup", handleMouseUp);
        gl.domElement.addEventListener("mouseleave", handleMouseUp);
        gl.domElement.addEventListener("touchstart", handleTouchStart);
        gl.domElement.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        gl.domElement.addEventListener("touchend", handleTouchEnd);

        return () => {
            gl.domElement.removeEventListener("mousedown", handleMouseDown);
            gl.domElement.removeEventListener("mousemove", handleMouseMove);
            gl.domElement.removeEventListener("mouseup", handleMouseUp);
            gl.domElement.removeEventListener("mouseleave", handleMouseUp);
            gl.domElement.removeEventListener("touchstart", handleTouchStart);
            gl.domElement.removeEventListener("touchmove", handleTouchMove);
            gl.domElement.removeEventListener("touchend", handleTouchEnd);
        };
    }, [camera, gl, isDragging, segments]);

    // Calculate badge position and rotation
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments[segments.length - 2];

    const badgePosition = lastSegment.position.clone();
    badgePosition.y -= 0.85;

    const direction = lastSegment.position
        .clone()
        .sub(secondLastSegment.position)
        .normalize();
    const angle = Math.atan2(direction.x, -direction.y);
    const badgeRotation = new THREE.Euler(0, 0, angle * 0.3);

    return (
        <>
            <Rope segments={segments} color="#6366f1" />

            {/* Anchor point at top */}
            <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#4f46e5" metalness={0.8} roughness={0.2} />
            </mesh>

            <Badge position={badgePosition} rotation={badgeRotation} />
        </>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            <pointLight position={[0, 0, 3]} intensity={0.5} color="#6366f1" />

            <Environment preset="city" />

            <InteractiveLanyard />
        </>
    );
}

export function Lanyard3D({ className = "" }: { className?: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div
                className={`w-full h-full flex items-center justify-center ${className}`}
            >
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            className={`w-full h-full ${className}`}
            style={{ touchAction: "none" }}
        >
            <Canvas
                camera={{ position: [0, 0.5, 5], fov: 35 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}

export default Lanyard3D;
