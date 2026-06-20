import { useState, useRef, useEffect, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";

/* Lightweight pan/zoom cropper (no external dependency). The user frames their picture inside a
   fixed 4:5 viewport; on confirm we render the visible region to a 4:5 canvas and hand back a Blob,
   so what gets uploaded is already cropped to the character-card aspect ratio (160x200 display). */
const FRAME_W = 200;          //on-screen crop frame, 4:5
const FRAME_H = 250;
const OUT_W = 320;            //exported resolution (2x the card so it stays crisp)
const OUT_H = 400;
const MAX_ZOOM = 4;           //how far past "cover" the user may zoom in

function ImageCropModal({ src, onCancel, onConfirm }) {
    const [img, setImg] = useState(null);         //loaded HTMLImageElement
    const [minScale, setMinScale] = useState(1);  //"cover" scale - image always fills the frame
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 }); //image top-left within the frame
    const dragRef = useRef(null);                 //{ startX, startY, ox, oy } while dragging

    //Keep the image covering the frame: offset is bounded so no empty gap can appear at any edge.
    const clamp = useCallback((off, sc, image) => {
        if (!image) return off;
        const minX = FRAME_W - image.naturalWidth * sc;
        const minY = FRAME_H - image.naturalHeight * sc;
        return {
            x: Math.min(0, Math.max(minX, off.x)),
            y: Math.min(0, Math.max(minY, off.y)),
        };
    }, []);

    //Load the source, derive the cover scale, and centre it in the frame.
    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            const base = Math.max(FRAME_W / image.naturalWidth, FRAME_H / image.naturalHeight);
            setImg(image);
            setMinScale(base);
            setScale(base);
            setOffset({
                x: (FRAME_W - image.naturalWidth * base) / 2,
                y: (FRAME_H - image.naturalHeight * base) / 2,
            });
        };
        image.src = src;
    }, [src]);

    //Zoom around the frame centre so the focal point stays put as the slider moves.
    const handleZoom = (e) => {
        const next = Number(e.target.value);
        const cx = FRAME_W / 2, cy = FRAME_H / 2;
        const ratio = next / scale;
        const moved = {
            x: cx - (cx - offset.x) * ratio,
            y: cy - (cy - offset.y) * ratio,
        };
        setOffset(clamp(moved, next, img));
        setScale(next);
    };

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    };
    const onPointerMove = (e) => {
        if (!dragRef.current) return;
        const moved = {
            x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
            y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
        };
        setOffset(clamp(moved, scale, img));
    };
    const onPointerUp = () => { dragRef.current = null; };

    //Map the framed region back to source pixels and paint it onto the output canvas.
    const handleConfirm = () => {
        if (!img) return;
        const canvas = document.createElement("canvas");
        canvas.width = OUT_W;
        canvas.height = OUT_H;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            img,
            -offset.x / scale, -offset.y / scale, FRAME_W / scale, FRAME_H / scale,
            0, 0, OUT_W, OUT_H
        );
        canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/png");
    };

    return (
        <Modal show onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Crop image</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-center text-body-secondary small mb-3">
                    Drag to reposition, use the slider to zoom.
                </p>
                <div
                    style={{
                        position: "relative",
                        width: FRAME_W,
                        height: FRAME_H,
                        margin: "0 auto",
                        overflow: "hidden",
                        borderRadius: 8,
                        background: "#222",
                        cursor: "grab",
                        touchAction: "none",
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    {img && (
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: img.naturalWidth * scale,
                                height: img.naturalHeight * scale,
                                transform: `translate(${offset.x}px, ${offset.y}px)`,
                                userSelect: "none",
                                willChange: "transform",
                            }}
                        />
                    )}
                </div>
                <Form.Range
                    className="mt-3"
                    min={minScale}
                    max={minScale * MAX_ZOOM}
                    step={(minScale * (MAX_ZOOM - 1)) / 100 || 0.01}
                    value={scale}
                    onChange={handleZoom}
                    disabled={!img}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="success" onClick={handleConfirm} disabled={!img}>Use image</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ImageCropModal;
