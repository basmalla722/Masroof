import useInView from "../hooks/useInView";

export default function Reveal({
  as: Tag = "div",
  delay = 0,
  distance = 16,
  className = "",
  children,
  ...rest
}) {
  const [ref, inView] = useInView();

  const classes = [
    "reveal-item",
    inView ? "in" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref}
      className={classes}
      style={{ "--rd": `${distance}px`, "--d": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
