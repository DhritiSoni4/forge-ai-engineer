import {
  forwardRef,
  useEffect,
  useRef,
} from "react";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>((props, ref) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  const textareaRef =
    (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [props.value, textareaRef]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      className={[
        "min-h-[180px]",
        "max-h-[420px]",
        "w-full",
        "resize-none",
        "overflow-y-auto",
        "rounded-3xl",
        "border",
        "border-white/10",
        "bg-zinc-950/80",
        "px-6",
        "py-5",
        "text-[15px]",
        "leading-7",
        "text-white",
        "placeholder:text-zinc-500",
        "outline-none",
        "transition-all",
        "duration-300",
        "focus:border-violet-500/70",
        "focus:ring-4",
        "focus:ring-violet-500/10",
        "backdrop-blur-xl",
        props.className ?? "",
      ].join(" ")}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;