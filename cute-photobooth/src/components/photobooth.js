import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const frameOptions = [
    "/assets/frames/heart-frame.png",
    "/assets/frames/heart-frame-2.png",
    "/assets/frames/heart-frame-3.png",
    "/assets/frames/heart-frame-4.png", 

    // placeholder muna, update once done
];

const stickerOptions = [
    "/assets/stickers/leaf.png",
    "/assets/stickers/sparkles.png"

    // placeholder also, update ulit pag may design na
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };
const SLOT_WIDTH = 953;
const SLOT_HEIGHT = 599;

export default function Photobooth() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const frameImgRef = useRef(null);

    const slots = [
        { x: 123, y: 78 },
        { x: 123, y: 687 },
        { x: 123, y: 1286 },
        { x: 123, y: 1885 }
    ];


}