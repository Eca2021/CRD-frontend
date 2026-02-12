import React from "react";
import "./button.css";

export default function Button({
  as = "button",
  variant = "primary",   // primary | success | danger | secondary | ghost
  size = "md",           // sm | md | lg
  block = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) {
  const Comp = as;
  return (
    <Comp
      className={[
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        block ? "btn--block" : "",
        className
      ].join(" ").trim()}
      {...props}
    >
      {leftIcon ? <span className="btn__icon">{leftIcon}</span> : null}
      <span className="btn__label">{props.children}</span>
      {rightIcon ? <span className="btn__icon">{rightIcon}</span> : null}
    </Comp>
  );
}
