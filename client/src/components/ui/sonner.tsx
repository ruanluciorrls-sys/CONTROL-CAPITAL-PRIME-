import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      duration={3000}
      className="toaster group"
      toastOptions={{
        style: {
          background: "linear-gradient(145deg, #070e20, #0f1e45)",
          border: "1px solid rgba(212,160,23,0.25)",
          color: "#ffffff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          borderRadius: "14px",
          fontWeight: 600,
        },
      }}
      style={
        {
          "--normal-bg": "linear-gradient(145deg, #070e20, #0f1e45)",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(212,160,23,0.25)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
