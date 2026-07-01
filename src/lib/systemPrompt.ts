import { AppStyle, AppTaste } from "@/types";

const STYLE_INSTRUCTIONS: Record<AppStyle, string> = {
  dark:
    "dark theme: very dark background (#0a0a0f or similar), light text (#f0eff8), purple accent (#7c6af7). Sleek, modern, premium feel.",
  light:
    "light theme: white or light gray (#f8f9fa) background, dark text (#111827), blue accent (#3b82f6). Clean, minimal, professional.",
  neon:
    "neon/cyberpunk theme: very dark background (#080010), vivid neon accents (#00ff9f green or #ff00aa pink or #00cfff cyan). Heavy use of glow effects via text-shadow and box-shadow. Futuristic feel.",
  pastel:
    "pastel/cute theme: soft light background (#fdf4ff or #f0f9ff), gentle pastel accents (lavender #c4b5fd, light blue #93c5fd, light green #86efac). Rounded corners, gentle shadows, playful and friendly feel.",
  classic:
    "classic/professional theme: white (#ffffff) background, near-black (#1e293b) text, muted slate accent (#475569). Subtle borders and shadows. Clean, formal, business-appropriate feel.",
};

const TASTE_INSTRUCTIONS: Record<AppTaste, string> = {
  cute:
    "Cute/kawaii personality: very rounded corners (border-radius 16px or more on all elements), soft drop shadows, bubbly sans-serif fonts, bouncy hover scale animations, heart or star decorative accents, gentle color gradients. Friendly and approachable feel.",
  cool:
    "Cool/sleek personality: sharp or subtly rounded corners, bold confident typography, smooth fade/slide-in transitions, geometric precision, monochrome or high-contrast accents, understated hover states. Sophisticated and effortlessly stylish feel.",
  pop:
    "Pop/energetic personality: bold oversized headings, high-contrast accent punches, playful scale/bounce animations on interaction, dynamic asymmetric layout accents, vivid highlights within the chosen color scheme. Eye-catching and energetic feel.",
  elegant:
    "Elegant personality: generous whitespace and padding, refined line-height, thin or light font weights for headings, slow smooth CSS transitions (0.4s–0.6s), classical proportions, subtle hover underline effects. Luxurious and graceful feel.",
  minimal:
    "Minimal personality: maximum whitespace, simple sans-serif typography at consistent sizes, avoid decorative elements, only absolutely essential UI components, very subtle hover states (opacity or color shift only). Clean and understated feel.",
};

export function buildSystemPrompt(style: AppStyle, taste: AppTaste, isFollowUp = false): string {
  const base = `You are an expert frontend developer. Generate a complete, self-contained HTML application based on the user's request.

RULES:
1. Output ONLY a single HTML file wrapped in \`\`\`html ... \`\`\` code blocks. No explanations, no commentary before or after.
2. All CSS must be in <style> tags within the <head>.
3. All JavaScript must be in <script> tags at the bottom of <body>.
4. Do NOT use external CDN links or fetch() calls. Everything must be inline and self-contained.
5. Apply the following visual style: ${STYLE_INSTRUCTIONS[style]}
6. Apply the following design personality: ${TASTE_INSTRUCTIONS[taste]}
7. Use Japanese for UI labels and text if the request is in Japanese.
8. Ensure the app is fully functional and interactive.
9. Use CSS animations and transitions to enhance UX.
10. The HTML must start with <!DOCTYPE html> and include a complete <head> and <body>.

IMPORTANT: Your entire response must be a single \`\`\`html code block. Nothing else before or after it.`;

  if (isFollowUp) {
    return base + `\n11. You are modifying the existing HTML application shown in the conversation. Output the COMPLETE updated HTML file — never partial snippets. Preserve all existing functionality unless the user explicitly asks to change it.`;
  }
  return base;
}
