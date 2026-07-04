import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const frameOptions = [
    "/assets/frames/nya_frame.png",
];

const stickerOptions = [
    "/assets/stickers/leaf.png",
    "/assets/stickers/sparkles.png"
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };
const SLOT_WIDTH = 648;
const SLOT_HEIGHT = 378;

 const slots = [
    { x: 84, y: 59 },
    { x: 83, y: 467 },
    { x: 85, y: 878 },
    { x: 87, y: 1293 },
    ];

export default function PhotoBooth() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const frameImgRef = useRef(null);

   
    const [selectedFrame, setSelectedFrame] = useState(null);
    const [mode, setMode] = useState("photo");

    const [photos, setPhotos] = useState([]);
    const [photoCount, setPhotoCount] = useState(0);
    const [canTakePhoto, setCanTakePhoto] = useState(true);
    const [draggingPhoto, setDraggingPhoto] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [countdown, setCountdown] = useState(null);

    const [stickers, setStickers] = useState([]);
    const [draggingSticker, setDraggingSticker] = useState(null);
    const [selectedSticker, setSelectedSticker] = useState(null);

    
    useEffect(() => {
        if (!selectedFrame) return;
        const img = new Image();
        img.src = selectedFrame;

        img.onload = () => {
            frameImgRef.current = img;
            drawCanvas();
        }
    }, [selectedFrame]); // eslint-disable-line react-hooks/exhaustive-deps

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !frameImgRef.current) return;

        const ctx = canvas.getContext("2d");

        const frameWidth = frameImgRef.current.width;
        const frameHeight = frameImgRef.current.height;
        canvas.width = frameWidth;
        canvas.height = frameHeight;


        canvas.style.aspectRatio = `${frameWidth} / ${frameHeight}`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        photos.forEach(p => {
            const slot = slots[p.slotIndex];
            const drawW = p.img.width * p.scale;
            const drawH = p.img.height * p.scale;
            const dx = slot.x + p.offsetX;
            const dy = slot.y + p.offsetY;

            ctx.save();
            ctx.beginPath();
            ctx.rect(slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
            ctx.clip();
            ctx.drawImage(p.img, dx, dy, drawW, drawH);
            ctx.restore();
        });
                ctx.drawImage(frameImgRef.current, 0, 0, frameWidth, frameHeight);

        stickers.forEach((s, i) => {
            ctx.drawImage(s.img, s.x, s.y, 150, 150);
            if (i === selectedSticker) {
                ctx.strokeStyle = "#ff7aa2";
                ctx.lineWidth = 4;
                ctx.strokeRect(s.x, s.y, 150, 150);
            }
        });
    };

    useEffect(drawCanvas, [photos, stickers, selectedSticker, photoCount]);

    const handleBack = () => {
        if (mode === "decorate") {
            setMode("photo");
            setCanTakePhoto(false);
            setStickers([]);
            setSelectedSticker(null);
        } else {
            setSelectedFrame(null);
            setPhotos([]);
            setPhotoCount(0);
            setStickers([]);
            setSelectedSticker(null);
            setMode("photo");
            setCanTakePhoto(true);
        }
    };

    // photos
    const addPhoto = img => {
        if (photoCount >= 4) return;

        const scale = Math.max(SLOT_WIDTH / img.width, SLOT_HEIGHT / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = drawW > SLOT_WIDTH ? (SLOT_WIDTH - drawW) / 2 : 0;
        const offsetY = drawH > SLOT_HEIGHT ? (SLOT_HEIGHT - drawH) / 2 : 0;

        setPhotos(p => [
            ...p,
            { img, slotIndex: photoCount, scale, offsetX, offsetY }
        ]);

        setCanTakePhoto(true);

        setPhotoCount(c => {
            const next = c + 1;
            if (next === 4) setMode("decorate");
            return next;
        });
    };

    const takePhotoNow = () => {
        const src = webcamRef.current.getScreenshot();
        if (!src) return;
        const img = new Image();
        img.src = src;
        img.onload = () => addPhoto(img);
    };

    const capturePhoto = () => {
        if (!canTakePhoto || countdown !== null) return;

        setCanTakePhoto(false);
        setCountdown(3);

        let current = 3;
        const interval = setInterval(() => {
            current -= 1;

            if (current === 0) {
                clearInterval(interval);
                setCountdown(null);
                takePhotoNow();
            } else {
                setCountdown(current);
            }
        }, 1000);
    };

    const uploadPhoto = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => addPhoto(img);
        };

        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const redoLastPhoto = () => {
        if (!photos.length) return;
        setPhotos(p => p.slice(0, -1));
        setPhotoCount(c => Math.max(0, c - 1));
        setCanTakePhoto(true);
    };

    const getCoords = e => {
        const r = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
            y: (e.clientY - r.top) * (canvasRef.current.height / r.height)
        };
    };

    // drag photos
    const handleMouseDown = e => {
        const { x, y } = getCoords(e);
        if (mode === "photo") {
            for (let i = photos.length - 1; i >= 0; i--) {
                const p = photos[i];
                const slot = slots[p.slotIndex];
                const w = p.img.width * p.scale;
                const h = p.img.height * p.scale;

                if(
                    x >= slot.x + p.offsetX &&
                    x <= slot.x + p.offsetX + w &&
                    y >= slot.y + p.offsetY &&
                    y <= slot.y + p.offsetY + h
                ) {
                    setDraggingPhoto(i);
                    setDragOffset({
                        x: x - slot.x - p.offsetX,
                        y: y - slot.y - p.offsetY
                    });
                    return;
                }

            }
        }

        if (mode === "decorate") {
            for(let i = stickers.length - 1; i >= 0; i --){
                const s = stickers[i];
                if (x >= s.x && x <= s.x + 150 && y>= s.y && y <= s.y + 150) {
                    setDraggingSticker(i);
                    setSelectedSticker(i);
                    setDragOffset({x: x-s.x, y: y-s.y});
                    return;
                }
            }
        }
    };

    const handleMouseMove = e => {
        const {x,y} = getCoords(e);

        if (draggingPhoto !== null && mode === "photo") {
            setPhotos(prev => {
                const updated = [...prev];
                const p = updated[draggingPhoto];
                const slot = slots[p.slotIndex];
                const w = p.img.width * p.scale;
                const h = p.img.height * p.scale;

                p.offsetX = x - slot.x - dragOffset.x;
                p.offsetY = y - slot.y - dragOffset.y;
                p.offsetX = Math.min(Math.max(p.offsetX, SLOT_WIDTH - w), 0);
                p.offsetY = Math.min(Math.max(p.offsetY, SLOT_HEIGHT - h),0);

                return updated;
            });
        }

        if (draggingSticker != null && mode === "decorate") {
            setStickers(s => {
                const u = [...s];
                u[draggingSticker] = {
                    ...u[draggingSticker],
                    x: x - dragOffset.x,
                    y: y - dragOffset.y
                };
                return u;
            });
        }
    };

    const handleTouchStart = e => {
        if (!e.touches || !e.touches.length) return;
        handleMouseDown(e.touches[0]);
    };

    const handleTouchMove = e => {
        if (!e.touches || !e.touches.length) return;
        if (draggingPhoto !== null || draggingSticker !== null) {
            e.preventDefault();
        }
        handleMouseMove(e.touches[0]);
    };

    const handleMouseUp = () => {
        setDraggingPhoto(null);
        setDraggingSticker(null);
    };

    const addSticker = src => {
        const img = new Image();
        img.src = src;
        img.onload = () =>
            setStickers(s => [...s, {img, x: 400, y: 100}]);
    };

    useEffect(() => {
        const handleKeyDown = e => {
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedSticker != null &&
                mode === "decorate"
            ){
                setStickers(s => s.filter((_,i) => i !== selectedSticker));
                setSelectedSticker(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedSticker, mode]); // eslint-disable-line react-hooks/exhaustive-deps


    const downloadPhoto = () => {
        const a = document.createElement("a");
        a.href= canvasRef.current.toDataURL("image.png");
        a.download = "photo-strip.png";
        a.click();
    };

    return (
        <div className="pb-root">
            <style>{`
                .pb-root {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px;
                }
                .pb-root * { box-sizing: border-box; }

                .pb-topbar {
                    width: 100%;
                    max-width: 700px;
                    position: relative;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 44px;
                }
                .pb-title {
                    margin: 0;
                    text-align: center;
                    width: 100%;
                    font-size: clamp(16px, 4vw, 24px);
                    line-height: 1.4;
                    padding: 0 8px;
                }
                .pb-back-btn {
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 40px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                }

                .pb-main {
                    width: 100%;
                    max-width: 700px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }

                .pb-frame-picker {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 24px;
                    justify-content: center;
                    width: 100%;
                }
                .pb-frame-thumb {
                    width: clamp(120px, 40vw, 180px);
                    height: auto;
                    cursor: pointer;
                    border-radius: 12px;
                    box-shadow: 0 8px 8px rgba(0,0,0,0.15);
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                }
                .pb-frame-thumb:hover {
                    transform: scale(1.08);
                    box-shadow: 0 12px 30px rgba(255,122,162,0.45);
                }
                .pb-frame-thumb.selected {
                    transform: scale(1.08);
                    box-shadow: 0 12px 30px rgba(255,122,162,0.45);
                }

                .pb-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 32px;
                    align-items: flex-start;
                    justify-content: center;
                    width: 100%;
                }
                .pb-controls {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 400px;
                }
                .pb-webcam-wrap {
                    position: relative;
                    width: 100%;
                }
                .pb-webcam-wrap video {
                    width: 100%;
                    border-radius: 12px;
                    display: block;
                }
                .pb-countdown {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: clamp(48px, 15vw, 96px);
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.6);
                    background: rgba(0,0,0,0.25);
                    border-radius: 12px;
                    pointer-events: none;
                }
                .pb-btn-row {
                    margin-top: 16px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                    width: 100%;
                }
                .pb-sticker-picker {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                }
                .pb-sticker-thumb {
                    width: clamp(40px, 12vw, 50px);
                    cursor: pointer;
                }

                .pb-canvas-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 260px;
                }
                .pb-canvas {
                    width: 100%;
                    max-width: 260px;
                    height: auto;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    touch-action: none;
                }
                .pb-download-row {
                    margin-top: 16px;
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

                .pb-btn {
                    font-family: "CantikaCute";
                    padding: 10px 20px;
                    font-size: clamp(15px, 3.5vw, 20px);
                    cursor: pointer;
                    font-family: CantikaCute, inherit;
                    color: #8c5b4a;
                    border: 2px solid #8c5b4a;
                    border-radius: 8px;
                    background: white;
                }
                .pb-btn-redo {
                    font-size: 22px;
                    padding: 4px 10px;
                }
                .pb-btn-upload {
                    cursor: pointer;
                }

                @media (max-width: 560px) {
                    .pb-root { padding: 8px; gap: 14px; }
                    .pb-back-btn { padding: 0 10px; height: 34px; font-size: 14px; }
                    .pb-row { gap: 20px; }
                    .pb-canvas-col { max-width: 220px; }
                    .pb-canvas { max-width: 220px; }
                }
            `}</style>

            {/* top bar with back btn and text */}
            <div className="pb-topbar">
                {selectedFrame && (
                    <button className="pb-btn pb-back-btn" onClick={handleBack}>
                        ← Back
                    </button>
                )}

                <h1 className="pb-title">
                    {!selectedFrame
                        ? "(๑´• .̫ •ू`๑) Choose your frame!"
                        : mode === "photo"
                            ? "(｡・//ε//・｡) Cheeeseee"
                            : "Add some sticekrs (´• ω •`) ♡"}

                </h1>
            </div>
            <div className="pb-main">
                {!selectedFrame ? (
                    <div className="pb-frame-picker">
                        {frameOptions.map((src) => {
                            const isSelected = selectedFrame === src;

                            return (
                                <img
                                    key={src}
                                    src={src}
                                    alt="frame"
                                    onClick={() => setSelectedFrame(src)}
                                    className={`pb-frame-thumb${isSelected ? " selected" : ""}`}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="pb-row">
                        <div className="pb-controls">
                            {mode === "photo" && (
                                <>
                                    <div className="pb-webcam-wrap">
                                        {/* Webcam */}
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/png"
                                            videoConstraints = {videoConstraints}
                                            mirrored = {true}
                                            />

                                        {/* Overlay countdown */}

                                        {countdown != null && (
                                            <div className="pb-countdown">
                                                {countdown}
                                                </div>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="pb-btn-row">
                                        {canTakePhoto && (
                                            <>
                                                <button className="pb-btn" onClick={capturePhoto}>
                                                    Take Photo
                                                </button>
                                                <label className="pb-btn pb-btn-upload">
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={uploadPhoto}
                                                        style={{ display: "none"}}
                                                        />
                                                </label>
                                            </>
                                        )}
                                        {/* redo btn */}
                                        {photoCount > 0 && (
                                            <button
                                                className="pb-btn pb-btn-redo"
                                                onClick = {redoLastPhoto}
                                            >
                                                ⟳
                                            </button>
                                        )}

                                    </div>
                                </>
                            )}

                            {mode === "decorate" && (
                                <div className="pb-sticker-picker">
                                    {stickerOptions.map((src) => (
                                        <img
                                            key={src}
                                            src={src}
                                            alt="sticker"
                                            onClick={() => addSticker(src)}
                                            className="pb-sticker-thumb"
                                        />
                                    ))}
                                </div>
                            )
                            }
                        </div>

                        {/* Display frame */}
                            <div className="pb-canvas-col">
                                <canvas
                                    ref={canvasRef}
                                    className="pb-canvas"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleMouseUp}
                                />

                                {mode === "decorate" && (
                                <div className="pb-download-row">
                                    <button className="pb-btn" onClick={downloadPhoto}>
                                        Download
                                    </button>
                                </div>
                                )}
                            </div>
                    </div>
                )
                }
            </div>
        </div>
    )
}