export const globalStyles = `
.astraion { color-scheme: light dark; min-height: 100vh; background: hsl(var(--background)); color: hsl(var(--foreground)); }
.astraion .navlink { color: hsl(var(--muted-foreground)); }

.astraion.light {
  --primary: 224 76% 15%;
  --primary-glow: 224 76% 25%;
  --accent: 43 96% 56%;
  --background: 210 40% 98%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --muted-foreground: 224 10% 40%;
  --danger: 0 72% 50%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 15%), hsl(224 76% 25%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 15% / 0.25);
}
.astraion.dark {
  --primary: 224 76% 70%;
  --accent: 43 96% 56%;
  --background: 224 71% 4%;
  --card: 224 76% 6%;
  --foreground: 210 40% 98%;
  --muted-foreground: 224 10% 70%;
  --danger: 0 72% 62%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 20%), hsl(224 76% 35%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 10% / 0.45);
}
`;
