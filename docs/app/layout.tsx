import "./globals.css";

import { Inter as interFont } from "next/font/google";

const inter = interFont({ subsets: ["latin"] });

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={inter.className}>{children}</body>
  </html>
);

export default layout;
