import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a120e" }}>
        <svg width="140" height="140" viewBox="0 0 64 64">
          <ellipse cx="32" cy="32" rx="15" ry="21" transform="rotate(28 32 32)" fill="#8e5a36" />
          <path d="M38.5 13.5c-9 7-3.5 15.5-7 22.5-2.4 4.8-5.8 7.5-7.5 14.5" fill="none" stroke="#c9705f" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
