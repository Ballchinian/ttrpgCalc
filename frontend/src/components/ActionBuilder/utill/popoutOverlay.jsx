import { useState, useRef, useEffect } from "react";
import { Overlay, Popover } from "react-bootstrap";

function PopoutOverlay({ label, list, onRemove, effectOrTrait, EffectLine }) {
    const [show, setShow] = useState(false);
    const target = useRef(null);
    const closeTimer = useRef(null);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const labelStyle = {
        minWidth: "60px",
    };

    if (!list?.length) return <span style={labelStyle}>{label}</span>;

    const open = () => {
        clearTimeout(closeTimer.current);
        setShow(true);
    };

    const close = () => {
        closeTimer.current = setTimeout(() => {
            setShow(false);
        }, 80); //To prevent flickering between origin and target
    };

    return (
        <>
            <span 
                ref={target}
                onMouseEnter={open}
                onMouseLeave={close}
                style={{...labelStyle, cursor: "help", textDecoration: "underline dotted"}}
            >
                {label}
            </span>

            <Overlay target={target.current} show={show} placement="right">
                {(props) => (
                    <Popover {...props} onMouseEnter={open} onMouseLeave={close}>
                        <Popover.Body>
                            <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                                {list.map((item, idx) => (
                                    <li
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "0.5rem"
                                        }}
                                    >   
                                        {effectOrTrait === "effect" ? <EffectLine effect={item} /> : <span>{item}</span>}
                                        <button
                                            onClick={() => onRemove(idx)}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "red",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Popover.Body>
                    </Popover>
                )}
            </Overlay>
        </>
    );
}

export default PopoutOverlay;