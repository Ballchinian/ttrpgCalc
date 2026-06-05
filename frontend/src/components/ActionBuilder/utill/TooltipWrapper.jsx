import { OverlayTrigger, Tooltip } from "react-bootstrap";

function TooltipWrapper({ label, tooltipContent, placement = "top" }) {
    return (
        <OverlayTrigger
            placement={placement}
            overlay={<Tooltip>{tooltipContent}</Tooltip>}
        >
            <span style={{ cursor: "help", textDecoration: "underline dotted" }}>
                {label}
            </span>
        </OverlayTrigger>
    );
}

export default TooltipWrapper;