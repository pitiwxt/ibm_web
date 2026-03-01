export default function SceneLighting() {
    return (
        <>
            {/* Soft ambient */}
            <ambientLight intensity={0.3} color="#8899ff" />

            {/* Main directional with shadows */}
            <directionalLight
                castShadow
                position={[10, 15, 8]}
                intensity={1.8}
                color="#ffffff"
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={80}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                shadow-bias={-0.001}
            />

            {/* Cool fill from below/side */}
            <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#3b5bdb" />

            {/* Warm accent from front */}
            <pointLight position={[5, 4, 6]} intensity={0.8} color="#f59e0b" distance={20} decay={2} />

            {/* Rim light */}
            <pointLight position={[-8, 6, -4]} intensity={0.5} color="#a855f7" distance={25} decay={2} />
        </>
    );
}
