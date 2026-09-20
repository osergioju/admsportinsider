import { useEffect } from "react";

const FONTS_ID = "club-header-fonts";

// Figtree (usada pelos designs C e D). Injeta uma vez só.
export function useHeaderFonts() {
    useEffect(() => {
        if (document.getElementById(FONTS_ID)) return;
        const link = document.createElement("link");
        link.id = FONTS_ID;
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(link);
    }, []);
}
